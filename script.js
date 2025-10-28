let allProducts = [];
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/800x800/667eea/ffffff?text=Sin+Imagen';

// Fetch and parse CSV
async function loadProducts() {
    try {
        const response = await fetch('products.csv');
        if (!response.ok) {
            throw new Error('Failed to load products.csv');
        }
        const csvText = await response.text();
        allProducts = parseCSV(csvText);
        populateCategoryFilter();
        populateBrandFilter();
        displayProducts(allProducts);
    } catch (error) {
        document.getElementById('productContainer').innerHTML = `
            <div class="error">
                <h2>⚠️ Error Cargando Productos</h2>
                <p>${error.message}</p>
                <p>Asegúrate de que products_filtered.csv esté en el mismo directorio que este archivo HTML.</p>
            </div>
        `;
    }
}

// Parse CSV to JSON
function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const products = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const product = {};
            headers.forEach((header, index) => {
                product[header] = values[index].trim();
            });
            products.push(product);
        }
    }

    return products;
}

// Handle CSV lines with commas in quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    return result;
}

// Populate category filter dropdown
function populateCategoryFilter() {
    const categories = [...new Set(allProducts.map(p => p['Product Type']))].sort();
    const categoryFilter = document.getElementById('categoryFilter');
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Populate brand filter dropdown
function populateBrandFilter() {
    const brands = [...new Set(allProducts.map(p => p.Brand))].sort();
    const brandFilter = document.getElementById('brandFilter');
    
    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        brandFilter.appendChild(option);
    });
}

// Display products
function displayProducts(products) {
    const container = document.getElementById('productContainer');
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <h2>No se Encontraron Productos</h2>
                <p>Intenta ajustar tus filtros o términos de búsqueda.</p>
            </div>
        `;
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'product-grid';

    products.forEach(product => {
        const card = createProductCard(product);
        grid.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(grid);
}

// Create product card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imageUrl = product['Product Photo'] || PLACEHOLDER_IMAGE;

    card.innerHTML = `
        <img src="${imageUrl}" 
             alt="${product['Product Name']}" 
             class="product-image"
             onerror="this.src='${PLACEHOLDER_IMAGE}'">
        <div class="product-info">
            <h2 class="product-name">${product['Product Name']}</h2>
            <span class="product-category">${product['Product Type']}</span>
            <div class="product-price">${product['Selling Price CRC']}</div>
            <div class="product-brand"><strong>Marca:</strong> ${product.Brand}</div>
            <div class="product-presentation"><strong>Tamaño:</strong> ${product.Presentation}</div>
        </div>
    `;

    return card;
}

// Filter products
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const brandFilter = document.getElementById('brandFilter').value;

    const filtered = allProducts.filter(product => {
        const matchesSearch = 
            product['Product Name'].toLowerCase().includes(searchTerm) ||
            product.Brand.toLowerCase().includes(searchTerm) ||
            product.Presentation.toLowerCase().includes(searchTerm);

        const matchesCategory = !categoryFilter || product['Product Type'] === categoryFilter;
        const matchesBrand = !brandFilter || product.Brand === brandFilter;

        return matchesSearch && matchesCategory && matchesBrand;
    });

    displayProducts(filtered);
}

// Event listeners
document.getElementById('searchInput').addEventListener('input', filterProducts);
document.getElementById('categoryFilter').addEventListener('change', filterProducts);
document.getElementById('brandFilter').addEventListener('change', filterProducts);

// Load products on page load
loadProducts();