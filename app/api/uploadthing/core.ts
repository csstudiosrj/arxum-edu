import { createUploadthing, type FileRouter } from 'uploadthing/next'

const f = createUploadthing()

export const ourFileRouter = {
  documentoMatricula: f({
    pdf: { maxFileSize: '8MB', maxFileCount: 1 },
    image: { maxFileSize: '4MB', maxFileCount: 1 },
  }).onUploadComplete(async ({ file }) => {
    console.log('[UploadThing] Documento enviado:', file.url)
    return { url: file.url }
  }),

  fotoGaleria: f({
    image: { maxFileSize: '8MB', maxFileCount: 20 },
  }).onUploadComplete(async ({ file }) => {
    console.log('[UploadThing] Foto enviada:', file.url)
    return { url: file.url }
  }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter