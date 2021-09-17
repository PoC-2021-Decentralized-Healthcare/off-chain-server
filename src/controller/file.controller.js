const { generateKeyPairSync } = require('crypto');

const processFile = require("../middleware/upload");
const { format } = require("util");
const { Storage } = require("@google-cloud/storage");

const storage = new Storage({ keyFilename: "./keys/google-cloud-key.json" });
const bucket = storage.bucket("healthcare-records");

const path = require('path')

console.log()
const upload = async (req, res) => {



  try {
    await processFile(req, res);

    if (!req.file) {
      return res.status(400).send({ message: "Please upload a file!" });
    }




    const {
      publicKey,
      privateKey,
    } = generateKeyPairSync('rsa', {
      modulusLength: 512,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: 'top secret'
      }
    });

    let originalname = req.file.originalname
    
    let filename =  Buffer.from(privateKey).toString('base64')
    //privateKey_from_base64 =  Buffer.from(privateKey_base64, 'base64').toString('ascii')



    const blob = bucket.file(filename);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    blobStream.on("error", (err) => {
      res.status(500).send({ message: err.message });
    });

    blobStream.on("finish", async (data) => {
      const publicUrl = format(
        `https://storage.googleapis.com/${bucket.name}/${blob.name}`
      );

      let resultAttributes = {
        filename: filename,
        extention: path.extname(originalname),
        url: publicUrl,
        message: ""
      }
  
      try {
        await bucket.file(filename).makePublic();
      } catch (e) {

        resultAttributes.message = "Uploaded the file successfully, but public access is denied!"
        return res.status(500).send(
          resultAttributes
          );
      }

      resultAttributes.message = "Uploaded the file successfully"
      res.status(200).send(resultAttributes);
    });

    blobStream.end(req.file.buffer);
  } catch (err) {
    console.log(err);

    if (err.code == "LIMIT_FILE_SIZE") {
      resultAttributes.message = "File size cannot be larger than 2MB!"
      return res.status(500).send(resultAttributes);
    }

    resultAttributes.message = `Could not upload the file. ${err}`
    res.status(500).send(resultAttributes);
  }
};

const getListFiles = async (req, res) => {
  try {
    const [files] = await bucket.getFiles();
    let fileInfos = [];

    files.forEach((file) => {
      fileInfos.push({
        name: file.name,
        url: file.metadata.mediaLink,
      });
    });

    res.status(200).send(fileInfos);
  } catch (err) {
    console.log(err);

    res.status(500).send({
      message: "Unable to read list of files!",
    });
  }
};

const download = async (req, res) => {
  try {
    const [metaData] = await bucket.file(req.params.name).getMetadata();
    res.redirect(metaData.mediaLink);
    
  } catch (err) {
    res.status(500).send({
      message: "Could not download the file. " + err,
    });
  }
};

module.exports = {
  upload,
  getListFiles,
  download,
};
