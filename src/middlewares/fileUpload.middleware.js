const multer = require("multer");


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    fileName: function (req, file, cb) {
        cb(null, file.originalName);
    }
})

const upload = multer({ storage: storage });

module.exports = upload;