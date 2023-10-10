import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { isAdminRequest } from './auth/[...nextauth]'
import { mongooseConnect } from '@/lib/mongoose'
import { Product } from '@/models/Product'

const bucketName = 'pump-next-ecommerce'
// const bucketName = process.env.S3_IMAGES_BUCKET

export default async function handle(req,res) {

  // console.log(req.body.params)
  // res.send({status: 200, msg:"Login Successful"})
  
  await mongooseConnect();
  // await isAdminRequest(req,res);

  // const links = [];

  const {productId,fileName,filterImages} = req.body.params

  // res.send(filterImages)

  const client = new S3Client({
    region:'ap-southeast-2',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    }
  });
  const input = { // DeleteObjectRequest
    Bucket: bucketName, // required
    Key: fileName, // required
  };
  const command = new DeleteObjectCommand(input);
  const response = await client.send(command);

  // res.send(response);

  const prdUpdate = await Product.updateOne(
    { _id: productId },
    { images: filterImages }
  );

  res.send(prdUpdate)

}

// export const config = {
//   api: {bodyParser: false},
// }