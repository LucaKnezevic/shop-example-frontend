document.addEventListener("DOMContentLoaded", async () => {
  let maxPrice = 100; 

  try {
      const response = await fetch('http://localhost:3003/api/products/max-price');
      if (response.ok) {
          const data = await response.json();
          maxPrice = Math.ceil(data.maxPrice) || 100;
      }
  } catch (error) {
      console.error('Fehler beim Abrufen des maximalen Preises:', error);
  }

  const priceRangeSlider = document.getElementById('priceRangeSlider');
  const priceRangeValue = document.getElementById('priceRangeValue');

  noUiSlider.create(priceRangeSlider, {
      start: [0, maxPrice],
      connect: true,
      range: {
          min: 0,
          max: maxPrice
      },
      step: 1,
  });

  priceRangeSlider.noUiSlider.on('update', (values) => {
      priceRangeValue.innerText = `${Math.round(values[0])} - ${Math.round(values[1])}€`;
  });

  document.querySelector("#btnLoadProducts").addEventListener("click", loadProducts);
});

async function loadProducts() {
  const priceRangeSlider = document.getElementById('priceRangeSlider');
  const [minPrice, maxPrice] = priceRangeSlider.noUiSlider.get();
  const searchName = document.getElementById('searchName').value.trim();

  let url = `http://localhost:3003/api/products?`;

  const params = [];
  if (minPrice) {
      params.push(`minPrice=${Math.round(minPrice)}`);
  }
  if (maxPrice) {
      params.push(`maxPrice=${Math.round(maxPrice)}`);
  }
  if (searchName) {
      params.push(`search=${(searchName)}`);
  }

  url += params.join('&');

  try {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const products = await response.json();
      console.log(products);
      displayProducts(products);
  } catch (error) {
      console.error("Error fetching products:", error);
      alert('Fehler beim Laden der Produkte.');
  }
}

document.getElementById('createProductForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const name = document.getElementById('name').value.trim();
  const price = document.getElementById('price').value;
  const description = document.getElementById('description').value.trim();

  if (!name || !price || !description) {
      alert('Bitte alle Felder ausfüllen.');
      return;
  }

  const data = { name: name, price: parseFloat(price), description: description };

  try {
      const response = await fetch('http://localhost:3003/api/products', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
      });

      if (response.ok) {
          alert('Produkt erfolgreich erstellt!');
          this.reset();
          loadProducts();
      } else {
          const errorData = await response.json();
          alert(`Fehler beim Erstellen des Produkts: ${errorData.error}`);
      }
  } catch (error) {
      console.error('Error:', error);
      alert('Beim Erstellen des Produkts ist ein Fehler aufgetreten.');
  }
});

function displayProducts(products) {
  const productsList = document.getElementById("productsList");
  productsList.innerHTML = "";

  if (products.length === 0) {
      const noProductsItem = document.createElement("li");
      noProductsItem.classList.add("list-group-item");
      noProductsItem.textContent = "Keine Produkte gefunden.";
      productsList.appendChild(noProductsItem);
      return;
  }

  products.forEach((product, index) => {
      const productItem = document.createElement("li");
      productItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

      const productInfo = document.createElement("span");
      productInfo.textContent = `${product.id} - ${product.name} - ${product.price}€ - ${product.description}`;

      const deleteButton = document.createElement("button");
      deleteButton.classList.add("btn", "btn-danger", "btn-sm");
      deleteButton.textContent = "Löschen";
      deleteButton.addEventListener("click", () => deleteProduct(product.id));

      productItem.appendChild(productInfo);
      productItem.appendChild(deleteButton);
      productsList.appendChild(productItem);
  });
}

async function deleteProduct(productId) {
  if (!confirm('Bist du sicher, dass du dieses Produkt löschen möchtest?')) {
      return;
  }

  try {
      const response = await fetch(`http://localhost:3003/api/products/${productId}`, {
          method: 'DELETE',
          headers: {
              'Content-Type': 'application/json'
          }
      });

      if (response.ok) {
          alert('Produkt erfolgreich gelöscht!');
      } else {
          const errorData = await response.json();
          alert(`Fehler beim Löschen des Produkts: ${errorData.error}`);
      }
  } catch (error) {
      console.error('Error:', error);
      alert('Beim Löschen des Produkts ist ein Fehler aufgetreten.');
  }
}
