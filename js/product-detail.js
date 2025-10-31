// Product Detail Page Script
let productData = null;
let availableImages = new Set();
const PLACEHOLDER_IMAGE = '../images/placeholder.svg';
const IMAGES_BASE_URL = '../images/';

// Get product ID from URL
function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Fetch available images
async function loadAvailableImages() {
    try {
        const response = await fetch('../images/images.json');
        if (!response.ok) {
            console.warn('Could not load images.json');
            return;
        }
        
        const imageFiles = await response.json();
        imageFiles.forEach(filename => {
            availableImages.add(filename);
        });
    } catch (error) {
        console.warn('Could not load image list:', error);
    }
}

// Parse CSV to find product
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

// Find product images
function findProductImages(productId) {
    const images = [];
    
    // Main image
    const mainFilename = `${productId}.webp`;
    if (availableImages.has(mainFilename)) {
        images.push(`${IMAGES_BASE_URL}${mainFilename}`);
    }
    
    // Additional images (1-5)
    for (let i = 1; i <= 5; i++) {
        const filename = `${productId}-${i}.webp`;
        if (availableImages.has(filename)) {
            images.push(`${IMAGES_BASE_URL}${filename}`);
        } else {
            break;
        }
    }
    
    // If no images found, use placeholder
    if (images.length === 0) {
        images.push(PLACEHOLDER_IMAGE);
    }
    
    return images;
}

// Create image gallery
function createGallery(images, productName) {
    let currentIndex = 0;
    
    const galleryHTML = `
        <div class="main-image-container">
            <img src="${images[0]}" alt="${productName}" class="main-product-image" id="mainImage">
        </div>
        ${images.length > 1 ? `
            <div class="thumbnail-gallery" id="thumbnailGallery">
                ${images.map((img, index) => `
                    <img src="${img}" 
                         alt="${productName} - ${index + 1}" 
                         class="thumbnail ${index === 0 ? 'active' : ''}" 
                         data-index="${index}">
                `).join('')}
            </div>
        ` : ''}
    `;
    
    return galleryHTML;
}

// Setup gallery interactions
function setupGalleryInteractions(images) {
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            mainImage.src = images[index];
            
            // Update active state
            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Display product details
function displayProduct(product) {
    const images = findProductImages(product.ID);
    
    const whatsappMessage = encodeURIComponent(
        `Hola! Me interesa el producto: ${product['Product Name']} (${product.Brand}) - ${product['Selling Price CRC']}`
    );
    const whatsappLink = `https://wa.me/50670935053?text=${whatsappMessage}`;
    
    const detailHTML = `
        <div class="product-detail-gallery">
            ${createGallery(images, product['Product Name'])}
        </div>
        
        <div class="product-detail-info">
            <div class="detail-tags">
                <span class="detail-category">${product['Product Type']}</span>
                <span class="detail-brand">${product.Brand}</span>
            </div>
            
            <h1 class="detail-name">${product['Product Name']}</h1>
            
            <div class="detail-price">${product['Selling Price CRC']}</div>
            
            ${product.Description ? `
                <div class="detail-description">
                    ${product.Description}
                </div>
            ` : ''}
            
            <div class="detail-specs">
                <div class="spec-item">
                    <span class="spec-label">Marca:</span>
                    <span class="spec-value">${product.Brand}</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Presentación:</span>
                    <span class="spec-value">${product.Presentation}</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Categoría:</span>
                    <span class="spec-value">${product['Product Type']}</span>
                </div>
            </div>
            
            <div class="detail-actions">
                <a href="${whatsappLink}" target="_blank" class="whatsapp-btn">
                    💬 Consultar por WhatsApp
                </a>
            </div>
        </div>
    `;
    
    document.getElementById('productDetailContent').innerHTML = detailHTML;
    
    // Setup gallery interactions if there are multiple images
    if (images.length > 1) {
        setupGalleryInteractions(images);
    }
    
    // Update page title
    document.title = `${product['Product Name']} - Crystal Beauty`;
}

// Load product data
async function loadProduct() {
    const productId = getProductIdFromUrl();
    
    if (!productId) {
        document.getElementById('productDetailContent').innerHTML = `
            <div class="error">
                <h2>⚠️ Producto no encontrado</h2>
                <p>No se especificó un producto válido.</p>
            </div>
        `;
        return;
    }
    
    try {
        // Load images list
        await loadAvailableImages();
        
        // Load products CSV
        const response = await fetch('../products.csv');
        if (!response.ok) {
            throw new Error('No se pudo cargar el catálogo');
        }
        
        const csvText = await response.text();
        const products = parseCSV(csvText);
        
        // Find the product
        const product = products.find(p => p.ID === productId);
        
        if (!product) {
            throw new Error('Producto no encontrado');
        }
        
        productData = product;
        displayProduct(product);
        
    } catch (error) {
        document.getElementById('productDetailContent').innerHTML = `
            <div class="error">
                <h2>⚠️ Error al cargar el producto</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Scroll to top button functionality
const scrollToTopBtn = document.getElementById('scrollToTop');

if (scrollToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Load product on page load
loadProduct();
