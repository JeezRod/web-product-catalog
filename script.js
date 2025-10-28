let allProducts = [];
let availableImages = new Set();
const PLACEHOLDER_IMAGE = './images/placeholder.svg';
const IMAGES_BASE_URL = './images/';

// Fetch list of available images from the images directory
async function loadAvailableImages() {
    try {
        const response = await fetch('./images/images.json');
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

// Fetch and parse CSV
async function loadProducts() {
    try {
        // Load available images first
        await loadAvailableImages();
        
        const response = await fetch('products.csv');
        if (!response.ok) {
            throw new Error('No se pudo cargar products.csv');
        }
        const csvText = await response.text();
        allProducts = parseCSV(csvText);
        populateCategoryFilter();
        populateBrandFilter();
        
        // Apply default filter (Skin Care)
        filterProducts();
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
    
    // Set default to Skin Care
    if (categories.includes('Skin Care')) {
        categoryFilter.value = 'Skin Care';
    }
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

    // Create all product cards
    products.forEach(product => {
        const card = createProductCard(product);
        grid.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(grid);
}

// Check if image exists for a product ID using the preloaded image list
function findProductImage(productId) {
    const filename = `${productId}.webp`;
    
    if (availableImages.has(filename)) {
        return `${IMAGES_BASE_URL}${filename}`;
    }
    
    return PLACEHOLDER_IMAGE;
}

// Create image gallery for multiple images
function createImageGallery(productId) {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'product-image-container';
    
    // Find main image synchronously using preloaded list
    const mainImageUrl = findProductImage(productId);
    
    // Only check for additional images if main image exists
    if (mainImageUrl !== PLACEHOLDER_IMAGE) {
        const additionalImages = findAdditionalImages(productId);
        const allImages = [mainImageUrl, ...additionalImages];
        
        // Create slider if there are multiple images, otherwise just show single image
        if (allImages.length > 1) {
            createImageSlider(imageContainer, allImages, productId);
        } else {
            createSingleImage(imageContainer, mainImageUrl, productId);
        }
    } else {
        createSingleImage(imageContainer, PLACEHOLDER_IMAGE, productId);
    }
    
    return imageContainer;
}

// Create a single image (no slider)
function createSingleImage(container, imageUrl, productId) {
    const img = document.createElement('img');
    img.className = 'product-image';
    img.alt = `Producto ${productId}`;
    img.src = imageUrl;
    img.onerror = function() {
        this.src = PLACEHOLDER_IMAGE;
    };
    container.appendChild(img);
}

// Create swipeable image slider
function createImageSlider(container, images, productId) {
    let currentIndex = 0;
    
    // Slider wrapper
    const slider = document.createElement('div');
    slider.className = 'image-slider';
    
    // Add all images
    images.forEach((url, index) => {
        const img = document.createElement('img');
        img.className = 'product-image';
        img.alt = `Producto ${productId} - Imagen ${index + 1}`;
        img.src = url;
        img.draggable = false;
        slider.appendChild(img);
    });
    
    container.appendChild(slider);
    
    // Navigation arrows
    const prevArrow = document.createElement('button');
    prevArrow.className = 'slider-arrow prev';
    prevArrow.innerHTML = '‹';
    prevArrow.setAttribute('aria-label', 'Imagen anterior');
    
    const nextArrow = document.createElement('button');
    nextArrow.className = 'slider-arrow next';
    nextArrow.innerHTML = '›';
    nextArrow.setAttribute('aria-label', 'Imagen siguiente');
    
    container.appendChild(prevArrow);
    container.appendChild(nextArrow);
    
    // Indicators (dots)
    const indicators = document.createElement('div');
    indicators.className = 'image-indicators';
    
    images.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'indicator-dot';
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        indicators.appendChild(dot);
    });
    
    container.appendChild(indicators);
    
    // Update slider position
    function updateSlider() {
        slider.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        // Update indicators
        indicators.querySelectorAll('.indicator-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
        
        // Update arrows
        prevArrow.disabled = currentIndex === 0;
        nextArrow.disabled = currentIndex === images.length - 1;
    }
    
    function goToSlide(index) {
        currentIndex = index;
        updateSlider();
    }
    
    function nextSlide() {
        if (currentIndex < images.length - 1) {
            currentIndex++;
            updateSlider();
        }
    }
    
    function prevSlide() {
        if (currentIndex > 0) {
            currentIndex--;
            updateSlider();
        }
    }
    
    // Arrow click events
    prevArrow.addEventListener('click', prevSlide);
    nextArrow.addEventListener('click', nextSlide);
    
    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    
    slider.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    slider.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextSlide(); // Swipe left
            } else {
                prevSlide(); // Swipe right
            }
        }
    }
    
    // Initialize
    updateSlider();
}

// Find additional images for a product (1-5) using preloaded image list
function findAdditionalImages(productId) {
    const additionalImages = [];
    
    // Check each number (1-5) sequentially
    for (let i = 1; i <= 5; i++) {
        const filename = `${productId}-${i}.webp`;
        
        if (availableImages.has(filename)) {
            additionalImages.push(`${IMAGES_BASE_URL}${filename}`);
        } else {
            // If we didn't find image #i, stop looking for higher numbers
            break;
        }
    }
    
    return additionalImages;
}

// Create product card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const productId = product.ID;

    // Create the card structure
    const imageGallery = createImageGallery(productId);
    
    const productInfo = document.createElement('div');
    productInfo.className = 'product-info';
    
    productInfo.innerHTML = `
        <h2 class="product-name">${product['Product Name']}</h2>
        <span class="product-category">${product['Product Type']}</span>
        <div class="product-price">${product['Selling Price CRC']}</div>
        <div class="product-brand"><strong>Marca:</strong> ${product.Brand}</div>
        <div class="product-presentation"><strong>Presentación:</strong> ${product.Presentation}</div>
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

// Scroll to top button functionality
const scrollToTopBtn = document.getElementById('scrollToTop');

if (scrollToTopBtn) {
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });

    // Scroll to top when clicked
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Load products on page load
loadProducts();