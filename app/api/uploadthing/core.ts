import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  // Define a rota de upload chamada "imageUploader" (que usamos no front)
  imageUploader: f({ 
    image: { maxFileSize: "4MB", maxFileCount: 1 }, 
    pdf: { maxFileSize: "4MB", maxFileCount: 1 } 
  })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload concluído:", file.url);
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;