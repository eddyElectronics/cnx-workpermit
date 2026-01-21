import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: Request) {
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

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', permitId)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const uploadedFiles = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Generate safe filename
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filename = `${timestamp}_${safeName}`
      const filepath = path.join(uploadsDir, filename)

      // Save file
      await writeFile(filepath, buffer)

      uploadedFiles.push({
        originalName: file.name,
        filename: filename,
        path: `/uploads/${permitId}/${filename}`,
        size: file.size,
        type: file.type,
      })

      console.log('File uploaded:', filename)
    }

    // Save file info to database
    console.log('=== Starting database save process ===')
    console.log('PermitId:', permitId, 'Type:', typeof permitId)
    console.log('Number of files to save:', uploadedFiles.length)
    
    const dbErrors = []
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i]
      try {
        console.log(`\n--- Saving file ${i + 1}/${uploadedFiles.length} ---`)
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
        
        console.log('Calling external API directly:', endpoint)
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify(requestBody),
        }).catch((fetchError) => {
          console.error('Fetch error:', fetchError)
          console.error('Fetch error message:', fetchError.message)
          throw new Error(`Database call failed: ${fetchError.message}`)
        })
        
        console.log('Response status:', response.status)
        
        const responseText = await response.text()
        console.log('Response body:', responseText)
        
        if (!response.ok) {
          const errorMsg = `HTTP ${response.status}: ${responseText}`
          console.error('Database save failed:', errorMsg)
          dbErrors.push({ file: file.originalName, error: errorMsg })
          continue
        }
        
        try {
          const result = JSON.parse(responseText)
          console.log('Document saved successfully:', result)
        } catch (e) {
          console.log('Response is not JSON:', responseText)
        }
        
      } catch (fileError) {
        const errorMsg = fileError instanceof Error ? fileError.message : String(fileError)
        console.error(`Failed to save file ${file.originalName}:`, errorMsg)
        dbErrors.push({ file: file.originalName, error: errorMsg })
      }
    }
    
    console.log('=== Database save process complete ===')
    console.log('Errors:', dbErrors.length)
    
    if (dbErrors.length > 0) {
      console.error('Database save errors:', dbErrors)
      return NextResponse.json({
        success: false,
        error: 'ไฟล์อัพโหลดสำเร็จแต่บันทึกลงฐานข้อมูลไม่สำเร็จ',
        details: dbErrors,
        files: uploadedFiles,
      }, { status: 207 })
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `อัพโหลด ${uploadedFiles.length} ไฟล์สำเร็จ`,
    })
  } catch (error: unknown) {
    console.error('Upload error:', error)
    const message = error instanceof Error ? error.message : 'อัพโหลดไฟล์ไม่สำเร็จ'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
