import Layout from "@/components/Layout"
import axios from 'axios';
import { useEffect, useState } from "react"
import { withSwal } from "react-sweetalert2";
// import Categories from './categories';

function Categories({ swal }) {
  const [editedCategory, setEditedCategory] = useState(null);
  const [name, setName] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [properties, setProperties] = useState([]);
  useEffect(() => {
    fetchCategories()
  }, [])

  function fetchCategories() {
    axios.get('/api/categories').then(result => {
      setCategories(result.data);
    })
  }

  async function saveCategory(ev) {
    ev.preventDefault();
    const data = {
      name,
      parentCategory,
      properties: properties.map(p => ({
        name: p.name,
        values: p.values.split(','),
      }))
    }
    if (editedCategory) {
      data._id = editedCategory._id
      await axios.put('/api/categories', data)
      setEditedCategory(null)
    } else {
      await axios.post('/api/categories', data)
    }
    setName('');
    setParentCategory('');
    setProperties([]);
    fetchCategories();
  }

  function editCategory(category) {
    setEditedCategory(category);
    setName(category.name);
    setParentCategory(category.parent?._id);
    setProperties(
      category.properties.map(({ name, values }) => ({
      name,
      values: values.join(',')
    })))
  }

  function deleteCategory(item) {
    swal.fire({
      title: 'Are you sure?',
      text: `Do you want ot delete ${item.name}?`,
      showCancelButton: true,
      cancelButtonText: 'Cancel',
      confirmButtonText: 'Yes, Delete!',
      confirmButtonColor: '#d55',
      reverseButtons: true,
    }).then(async result => {
      if (result.isConfirmed) {
        const { _id } = item;
        await axios.delete('/api/categories?_id=' + _id)
        fetchCategories();
      }
    })
  }

  function addProperty() {
    setProperties(prev => {
      return [...prev, { name: '', values: '' }]
    });
  }

  function handlePropertyNameChange(index, property, newName) {
    setProperties(prev => {
      const properties = [...prev];
      properties[index].name = newName;
      return properties;
    })
  }

  function handlePropertyValuesChange(index, property, newValues) {
    setProperties(prev => {
      const properties = [...prev];
      properties[index].values = newValues;
      return properties;
    })
  }

  function removeProperty(indexToRemove) {
    setProperties(prev => {
      return [...prev].filter((p, pIndex) => {
        return pIndex !== indexToRemove;
      })
    })
  }

  return (
    <Layout>
      <h1>Categories</h1>
      <label>{editedCategory ? `Edit category ${editedCategory.name}` : 'Create New Category'} </label>
      <form onSubmit={saveCategory}>
        <div className="flex gap-1">
          <input
            type="text"
            placeholder={'Category Name'}
            onChange={ev => setName(ev.target.value)}
            value={name}
          />
          <select
            onChange={ev => setParentCategory(ev.target.value)}
            value={parentCategory}
          >
            <option value="0" key={'00'}>No Parent Category</option>
            {categories.length > 0 && categories.map((item, index) => (
              <option value={item._id} key={index}>{item.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="block">Properties</label>
          <button
            onClick={addProperty}
            type="button"
            className="btn-default text-sm mb-2">
            Add new property
          </button>
          {properties.length > 0 && properties.map((property, index) => (
            <div className="flex gap-1 mb-2" key={index}>
              <input type="text"
                value={property.name}
                className="mb-0"
                onChange={ev => handlePropertyNameChange(index, property, ev.target.value)}
                placeholder="property name (example: color)" />
              <input type="text"
                className="mb-0"
                onChange={ev => handlePropertyValuesChange(index, property, ev.target.value)}
                value={property.values}
                placeholder="values, comma separated" />
              <button
                onClick={() => removeProperty(index)}
                type="button"
                className="btn-red">
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {editedCategory && (
            <button
              type="button"
              onClick={() => {
                setEditedCategory(null)
                setName('')
                setParentCategory('')
                setProperties([])
              }}
              className="btn-default">Cancel</button>
          )}
          <button className="btn-primary py-1">Save</button>
        </div>
      </form>
      {!editedCategory && (
        <table className="basic mt-4">
          <thead>
            <tr>
              <td>Category Name</td>
              <td>Parent Category</td>
              <td></td>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 && categories.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item?.parent?.name}</td>
                <td>
                  <button onClick={() => editCategory(item)}
                    className="btn-default mr-1">Edit</button>
                  <button
                    onClick={() => deleteCategory(item)}
                    className="btn-red">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  )
}

export default withSwal(({ swal }, ref) => (
  <Categories swal={swal} />
))