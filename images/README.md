# Images Directory

This directory contains product images for the catalog.

## Placeholder Image

- `placeholder.svg` - Default placeholder image shown when no product image is available

## Image Naming Convention

Images should be named using the product ID from the CSV file:

### Single Image per Product
- `{product_id}.jpg` (e.g., `1.jpg`, `23.jpg`)

### Multiple Images per Product
- `{product_id}.jpg` - Main image (first image)
- `{product_id}-2.jpg` - Second image
- `{product_id}-3.jpg` - Third image  
- `{product_id}-4.jpg` - Fourth image
- `{product_id}-5.jpg` - Fifth image

## Example Structure
```
images/
├── 1.jpg          # Product ID 1 - Main image
├── 1-2.jpg        # Product ID 1 - Second image
├── 1-3.jpg        # Product ID 1 - Third image
├── 2.jpg          # Product ID 2 - Single image
├── 3.jpg          # Product ID 3 - Main image
├── 3-2.jpg        # Product ID 3 - Second image
└── README.md
```

## Supported Formats
- JPG (.jpg) - Primary format
- The system will automatically check for up to 5 images per product
- If no images are found, a placeholder will be displayed

## GitHub Integration
Images are loaded directly from the GitHub repository using:
`https://raw.githubusercontent.com/JeezRod/web-product-catalog/main/images/{image_name}`

## How to Add New Images
1. Upload your product image(s) to this folder
2. Name them according to the product ID:
   - For single image: `{product_id}.jpg`
   - For multiple images: `{product_id}.jpg`, `{product_id}-2.jpg`, etc.
3. The application will automatically detect and display all available images

## Recommendations
- **Image Size**: 800x800px or larger for best quality
- **Aspect Ratio**: Square (1:1) recommended for consistency
- **File Size**: Keep under 500KB for faster loading
- **Quality**: Use high-quality images to showcase products effectively