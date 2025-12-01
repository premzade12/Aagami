import multer from "multer";

const storage = multer.diskStorage({
    destination:(req,file,cb) => {
        cb(null,"./public")
    },
    filename:(req,file,cb) => {
        cb(null,file.originalname)
    }
})

const upload = multer({storage});

// Memory storage for visual search
const memoryUpload = multer({ storage: multer.memoryStorage() });

export { memoryUpload };
export default upload;