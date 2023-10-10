// import Layout from "@/components/Layout";
// import { redirect } from "next/dist/server/api-utils";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Spinner from "./Spinner";
import { ReactSortable } from "react-sortablejs";
import { toast } from 'react-toastify';
import Image from "next/image";

const bucketName = 'pump-next-ecommerce'
// const bucketName = process.env.S3_IMAGES_BUCKET

export default function ProductForm({
  _id,
  title: existingTitle,
  description: existingDescription,
  price: existingPrice,
  images: existingImages,
  category: assignedCategory,
  properties: assignedProperties,
}) {
  const [title, setTitle] = useState(existingTitle || '');
  const [description, setDescription] = useState(existingDescription || '');
  const [category, setCategory] = useState(assignedCategory || '');
  const [productProperties, setProductProperties] = useState(assignedProperties || {})
  const [price, setPrice] = useState(existingPrice || []);
  const [images, setImages] = useState(existingImages || []);
  const [goToProducts, setGoToProducts] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState([]);

  const router = useRouter();
  useEffect(() => {
    axios.get('/api/categories').then(result => {
      setCategories(result.data)
    })
  }, [])
  async function saveProduct(e) {
    e.preventDefault();
    const data = { title, description, price, images, category, properties: productProperties };
    if (_id) {
      // update
      await axios.put('/api/products', { ...data, _id });
    } else {
      // create
      await axios.post('/api/products', data);
    }
    setGoToProducts(true);
  }

  if (goToProducts) {
    router.push('/products')
  }

  async function uploadImage(e) {
    const files = e.target?.files;

    if (files?.length > 0) {
      setIsUploading(false)
      const data = new FormData();

      for (const file of files) {
        data.append('file', file)
      }

      const res = await axios.post('/api/upload', data);
      setImages(oldImages => {
        return [...oldImages, ...res.data.links]
      })

      setIsUploading(false)
    }
  }

  function updateImagesOrder(images) {
    setImages(images)
  }

  function setProductProp(propName, value) {
    setProductProperties(prev => {
      const newProductProps = { ...prev }
      newProductProps[propName] = value;
      return newProductProps;
    })
  }

  const propertiesToFill = [];
  if (categories.length > 0 && category) {
    let catInfo = categories.find(({ _id }) => _id === category)
    propertiesToFill.push(...catInfo.properties)
    while (catInfo?.parent?._id) {
      const parentCat = categories.find(({ _id }) => _id === catInfo?.parent?._id)
      propertiesToFill.push(...parentCat.properties)
      catInfo = parentCat;
    }
  }

  const deleteImage = async (link) => {

    let filterImages = images.filter(item => {
      return item !== link
    })

    setImages(filterImages)

    const strLink = String(link)
    const search = String(`https://${bucketName}.s3.amazonaws.com/`)
    const fileName = strLink.replace(search, '')

    const res = await axios.post('/api/deleteimage', {
      params: {
        productId: _id,
        fileName: fileName,
        filterImages: filterImages
      }
    }).then(response => {
      console.log(response.data)
      toast.success(`Delete Image ${fileName} success!`);
    })
    console.log(res)
  }

  return (
    <form onSubmit={saveProduct}>
      <label>Product name</label>
      <input
        type="text"
        placeholder="product name"
        value={title}
        onChange={(e) => setTitle(e.target.value)} />
      <label>Category</label>
      <select
        value={category}
        onChange={ev => setCategory(ev.target.value)}
      >
        <option value="">Uncategorized</option>
        {categories.length > 0 && categories.map((c, index) => (
          <option key={index} value={c._id}>{c.name}</option>
        ))}
      </select>
      {propertiesToFill.length > 0 && propertiesToFill.map((p, index) => (
        <div key={index} className="flex gap-1">
          <div>{p.name[0].toUpperCase() + p.name.substring(1)}</div>
          <div>
            <select
              value={productProperties[p.name]}
              onChange={(ev) =>
                setProductProp(p.name, ev.target.value)}
            >
              {p.values.map((v, index) => (
                <option key={index} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      ))}
      <label>
        Photos
      </label>

      <div className="mb-2 flex flex-warp gap-1">
        <ReactSortable
          list={images}
          className="flex flex-warp gap-1"
          setList={updateImagesOrder}>
          {!!images?.length && images.map((link, index) => (
            <div key={index} className="cursor-pointer relative h-24 bg-white p-4 shadow-sm rounded-sm border border-gray-200">
              <div onClick={() => deleteImage(link)} className="absolute inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 border-1 border-white rounded-full -top-1 -right-1 dark:border-gray-900">x</div>
              <Image
                src={link}
                alt=""
                style={{
                  objectFit: 'contain'
                }}
                width={300}
                height={400}
                className="rounded-lg"
              />
            </div>
          ))}
        </ReactSortable>
        {isUploading && (
          <div className="h-24 p-1 bg-gray-200 flex items-center">
            <Spinner />
          </div>
        )}
        <label className="w-24 h-24 cursor-pointer text-center flex flex-col items-center justify-center text-sm gap-1 text-primary rounded-sm bg-white shadow-sm border border-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <div>
            Add image
          </div>
          <input type="file" onChange={uploadImage} className="hidden" />
        </label>
        {!images?.length && (
          <div>No Photos in this product</div>
        )}
      </div>

      <label>Description</label>
      <textarea
        placeholder="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <label>Price (in USD)</label>
      <input type="number" placeholder="price" value={price} onChange={(e) => setPrice(e.target.value)} />
      <button
        type="submit"
        className="btn-primary">Save</button>
    </form>
  )
}