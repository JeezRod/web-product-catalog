let allProducts = [];
const PLACEHOLDER_IMAGE = './images/placeholder.svg';
const IMAGES_BASE_URL = './images/';

// Fetch and parse CSV
async function loadProducts() {
    try {
        const response = await fetch('products.csv');
        if (!response.ok) {
            throw new Error('No se pudo cargar products.csv');
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
                <p>Asegúrate de que products.csv esté en el mismo directorio que este archivo HTML.</p>
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

// Generate image URLs for a product based on its ID
function generateImageUrls(productId) {
    const imageUrls = [];
    const extensions = ['jpg', 'png', 'jpeg', 'webp'];
    
    // Try main image with different extensions
    extensions.forEach(ext => {
        imageUrls.push(`${IMAGES_BASE_URL}${productId}.${ext}`);
    });
    
    // Try up to 5 additional images
    for (let i = 2; i <= 5; i++) {
        extensions.forEach(ext => {
            imageUrls.push(`${IMAGES_BASE_URL}${productId}-${i}.${ext}`);
        });
    }
    
    return imageUrls;
}

// Check if image exists and return the first valid one
async function getValidImageUrl(imageUrls) {
    for (const url of imageUrls) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok) {
                return url;
            }
        } catch (error) {
            // Continue to next image
        }
    }
    return PLACEHOLDER_IMAGE;
}

// Create image gallery for multiple images
function createImageGallery(productId, imageUrls) {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'product-image-container';
    
    // Main image display
    const mainImage = document.createElement('img');
    mainImage.className = 'product-image main-image';
    mainImage.alt = `Producto ${productId}`;
    mainImage.src = PLACEHOLDER_IMAGE;
    
    // Image thumbnails container (if multiple images exist)
    const thumbnailsContainer = document.createElement('div');
    thumbnailsContainer.className = 'image-thumbnails';
    
    // Create an image object to test loading without showing 404 in console
    const testImage = new Image();
    let validImageFound = false;
    let currentIndex = 0;
    
    function tryNextImage() {
        if (currentIndex >= imageUrls.length) {
            // No valid images found, keep placeholder
            return;
        }
        
        const url = imageUrls[currentIndex];
        currentIndex++;
        
        testImage.onload = function() {
            if (!validImageFound) {
                validImageFound = true;
                mainImage.src = url;
                
                // Try to find more images for gallery
                findAdditionalImages(productId, [url]);
            }
        };
        
        testImage.onerror = function() {
            // Try next image
            tryNextImage();
        };
        
        testImage.src = url;
    }
    
    function findAdditionalImages(productId, foundImages) {
        const additionalUrls = [];
        const extensions = ['jpg', 'png', 'jpeg', 'webp'];
        
        for (let i = 2; i <= 5; i++) {
            extensions.forEach(ext => {
                additionalUrls.push(`${IMAGES_BASE_URL}${productId}-${i}.${ext}`);
            });
        }
        
        const imageTests = additionalUrls.map(url => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(url);
                img.onerror = () => resolve(null);
                img.src = url;
            });
        });
        
        Promise.all(imageTests).then(results => {
            const validAdditional = results.filter(url => url !== null);
            const allImages = [...foundImages, ...validAdditional];
            
            if (allImages.length > 1) {
                allImages.forEach((url, index) => {
                    const thumbnail = document.createElement('img');
                    thumbnail.className = 'image-thumbnail';
                    thumbnail.src = url;
                    thumbnail.alt = `Imagen ${index + 1}`;
                    
                    // Add click event to change main image
                    thumbnail.addEventListener('click', () => {
                        mainImage.src = url;
                        thumbnailsContainer.querySelectorAll('.thumbnail-active').forEach(t => 
                            t.classList.remove('thumbnail-active'));
                        thumbnail.classList.add('thumbnail-active');
                    });
                    
                    if (index === 0) {
                        thumbnail.classList.add('thumbnail-active');
                    }
                    
                    thumbnailsContainer.appendChild(thumbnail);
                });
                
                imageContainer.appendChild(thumbnailsContainer);
            }
        });
    }
    
    // Start trying images
    tryNextImage();
    
    // Error handling for main image
    mainImage.onerror = function() {
        this.src = PLACEHOLDER_IMAGE;
    };
    
    imageContainer.appendChild(mainImage);
    if (thumbnailsContainer.children.length > 0) {
        imageContainer.appendChild(thumbnailsContainer);
    }
    
    return imageContainer;
}

// Create product card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const productId = product.ID;
    const imageUrls = generateImageUrls(productId);

    // Create the card structure
    const imageGallery = createImageGallery(productId, imageUrls);
    
    const productInfo = document.createElement('div');
    productInfo.className = 'product-info';
    
    productInfo.innerHTML = `
        <h2 class="product-name">${product['Product Name']}</h2>
        <span class="product-category">${product['Product Type']}</span>
        <div class="product-price">${product['Selling Price CRC']}</div>
        <div class="product-brand"><strong>Marca:</strong> ${product.Brand}</div>
        <div class="product-presentation"><strong>Tamaño:</strong> ${product.Presentation}</div>
    `;

    card.appendChild(imageGallery);
    card.appendChild(productInfo);

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