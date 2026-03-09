import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

function getOrCreateRequestId(request: Request): string {
  return request.headers.get('x-request-id') || `upload_${crypto.randomUUID()}`
}

export async function POST(request: Request) {
  const baseRequestId = getOrCreateRequestId(request)

  try {
    const formData = await request.formData()
    const permitId = formData.get('permitId') as string
    const files = formData.getAll('files') as File[]

    if (!permitId || files.length === 0) {
      return NextResponse.json(
        { error: 'ไม่พบ Permit ID หรือไฟล์' },
        { status: 400 }
      )
    }

    // Check if Vercel Blob is available
    const hasVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN

    const uploadedFiles = []

    for (const file of files) {
      // Generate safe filename
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filename = `${timestamp}_${safeName}`
      
      let filePath = ''

      if (hasVercelBlob) {
        // Upload to Vercel Blob Storage
        try {
          const blob = await put(`permits/${permitId}/${filename}`, file, {
            access: 'public',
          })
          filePath = blob.url
          console.log('File uploaded to Vercel Blob:', blob.url)
        } catch (error) {
          console.error('Vercel Blob upload failed:', error)
          throw error
        }
      } else {
        // Fallback to local filesystem (for development)
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', permitId)
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const filepath = path.join(uploadsDir, filename)
        await writeFile(filepath, buffer)
        
        filePath = `/uploads/${permitId}/${filename}`
        console.log('File uploaded locally:', filePath)
      }

      uploadedFiles.push({
        originalName: file.name,
        filename: filename,
        path: filePath,
        size: file.size,
        type: file.type,
      })
    }

    // Save file info to database
    console.log(`=== Starting database save process [${baseRequestId}] ===`)
    console.log('PermitId:', permitId, 'Type:', typeof permitId)
    console.log('Number of files to save:', uploadedFiles.length)
    
    const dbErrors = []
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i]
      const requestId = `${baseRequestId}_file_${i + 1}`
      try {
        console.log(`\n--- Saving file ${i + 1}/${uploadedFiles.length} [${requestId}] ---`)
        console.log('Document details:', {
          PermitId: parseInt(permitId),
          DocumentName: file.originalName,
          DocumentPath: file.path,
          DocumentType: file.type,
          FileSize: file.size,
        })
        
        const requestBody = {
          database: 'CNXWorkPermit',
          procedure: 'usp_AddPermitDocument',
          parameters: {
            PermitId: parseInt(permitId),
            DocumentName: file.originalName,
            DocumentPath: file.path,
            DocumentType: file.type,
            FileSize: file.size,
          },
        }
        
        console.log('Request body:', JSON.stringify(requestBody, null, 2))
        
        // Call external API directly instead of going through /api/proxy
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.airportthai.co.th/proxy/api'
        const apiKey = process.env.NEXT_PUBLIC_API_KEY || ''
        const endpoint = `${apiUrl}/procedure`
        
        console.log(`Calling external API directly [${requestId}]:`, endpoint)
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'x-request-id': requestId,
            'x-request-attempt': '1',
          },
          body: JSON.stringify(requestBody),
        }).catch((fetchError) => {
          console.error(`[${requestId}] Fetch error:`, fetchError)
          console.error(`[${requestId}] Fetch error message:`, fetchError.message)
          throw new Error(`Database call failed: ${fetchError.message}`)
        })
        
        console.log(`[${requestId}] Response status:`, response.status)
        
        const responseText = await response.text()
        console.log(`[${requestId}] Response body:`, responseText)
        
        if (!response.ok) {
          const errorMsg = `HTTP ${response.status}: ${responseText}`
          console.error(`[${requestId}] Database save failed:`, errorMsg)
          dbErrors.push({ file: file.originalName, error: errorMsg, requestId })
          continue
        }
        
        try {
          const result = JSON.parse(responseText)
          console.log(`[${requestId}] Document saved successfully:`, result)
        } catch (e) {
          console.log(`[${requestId}] Response is not JSON:`, responseText)
        }
        
      } catch (fileError) {
        const errorMsg = fileError instanceof Error ? fileError.message : String(fileError)
        console.error(`[${requestId}] Failed to save file ${file.originalName}:`, errorMsg)
        dbErrors.push({ file: file.originalName, error: errorMsg, requestId })
      }
    }
    
    console.log(`=== Database save process complete [${baseRequestId}] ===`)
    console.log('Errors:', dbErrors.length)
    
    if (dbErrors.length > 0) {
      console.error('Database save errors:', dbErrors)
      return NextResponse.json({
        success: false,
        error: 'ไฟล์อัพโหลดสำเร็จแต่บันทึกลงฐานข้อมูลไม่สำเร็จ',
        details: dbErrors,
        files: uploadedFiles,
        requestId: baseRequestId,
      }, {
        status: 207,
        headers: {
          'x-request-id': baseRequestId,
        },
      })
    }

    return NextResponse.json(
      {
        success: true,
        files: uploadedFiles,
        message: `อัพโหลด ${uploadedFiles.length} ไฟล์สำเร็จ`,
        requestId: baseRequestId,
      },
      {
        headers: {
          'x-request-id': baseRequestId,
        },
      }
    )
  } catch (error: unknown) {
    console.error(`[${baseRequestId}] Upload error:`, error)
    const message = error instanceof Error ? error.message : 'อัพโหลดไฟล์ไม่สำเร็จ'
    return NextResponse.json(
      { error: message, requestId: baseRequestId },
      {
        status: 500,
        headers: {
          'x-request-id': baseRequestId,
        },
      }
    )
  }
}
