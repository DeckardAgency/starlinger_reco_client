import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Product, ProductsCollection } from '@core/models';

// Helper function to generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to generate random price
function randomPrice(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// Helper function to generate random weight
function randomWeight(): string {
  const weights = ['0,2kg', '0,4kg', '0,8kg', '1,2kg', '1,5kg', '2,0kg', '3,5kg', '5,0kg', '7,5kg', '10,0kg'];
  return weights[Math.floor(Math.random() * weights.length)];
}

// Product name prefixes and suffixes for variety
const PART_PREFIXES = ['AIVV', 'BCSM', 'CTRL', 'DRVS', 'ELEC', 'FILT', 'GEAR', 'HYDR', 'INSP', 'JUNC'];
const PRODUCT_NAMES = [
  'Power Panel Touch Display',
  'Control Module Unit',
  'Servo Motor Assembly',
  'Hydraulic Pump System',
  'Temperature Sensor Kit',
  'Pressure Valve Controller',
  'Electric Drive Unit',
  'Gear Box Assembly',
  'Filter Replacement Set',
  'Cable Connector Pack',
  'Main Board Controller',
  'Cooling Fan Module',
  'Belt Drive System',
  'Bearing Assembly Kit',
  'Encoder Sensor Unit',
  'Pneumatic Cylinder',
  'Safety Switch Module',
  'PLC Interface Card',
  'Frequency Inverter',
  'Relay Control Board',
  'Terminal Block Set',
  'Fuse Protection Kit',
  'Motor Starter Unit',
  'Transformer Module',
  'Capacitor Bank',
  'Resistor Array',
  'LED Indicator Panel',
  'Emergency Stop Button',
  'Hand Wheel Assembly',
  'Lubrication Pump'
];

const TECHNICAL_DESCRIPTIONS = [
  'without battery, 24VDC; 130mA; 5.5W;',
  'IP65 rated, operating temp -20°C to +60°C',
  'Max torque 15Nm, 3000 RPM, brushless',
  'Flow rate 25L/min, max pressure 350 bar',
  'Range -50°C to +200°C, accuracy ±0.5°C',
  'DN25, PN16, stainless steel body',
  'Output 5.5kW, 400V 3-phase',
  'Ratio 1:10, input speed max 1500 RPM',
  '10 micron filtration, flow 50L/min',
  'M12 connector, 5-pin, shielded',
  'ARM Cortex-M4, 32-bit, 180MHz',
  '120mm, 24VDC, 2500 RPM, 45dB',
  'Width 25mm, length 1500mm, HTD profile',
  'Bore 35mm, OD 72mm, sealed',
  '1024 PPR, incremental, TTL output',
  'Bore 40mm, stroke 200mm, double acting',
  'NC contact, 24VDC, LED indicator',
  '16 DI/16 DO, 24VDC, modular',
  '0.75kW, 400V input, 0-400Hz output',
  '8 channels, 24VDC coil, LED status',
  '12-position, 4mm², DIN rail mount',
  '10A, 250VAC, fast-blow, ceramic',
  'DOL, 7.5kW, 400V, thermal overload',
  '230V/24V, 100VA, DIN rail',
  '3x470µF, 400V, electrolytic',
  '10kΩ, 10W, wirewound, ±5%',
  '8 LEDs, red/green, 24VDC',
  'Twist release, 40mm, NC+NO',
  'Dia 80mm, graduated, 6mm bore',
  'Flow 0.5L/min, 24VDC, automatic'
];

// Generate 30 dummy products
function generateDummyProducts(): Product[] {
  const products: Product[] = [];
  const baseDate = new Date('2025-01-01');

  for (let i = 0; i < 30; i++) {
    const productId = generateUUID();
    const mediaId = generateUUID();
    const prefix = PART_PREFIXES[i % PART_PREFIXES.length];
    const partNumber = `${prefix}-${String(10000 + i).padStart(5, '0')}`;
    const name = partNumber.toLowerCase();
    const createdDate = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
    const updatedDate = new Date(createdDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);

    const product: Product = {
      '@id': `/api/v1/products/${productId}`,
      '@type': 'Product',
      id: productId,
      name: name,
      slug: name,
      partNo: partNumber,
      shortDescription: PRODUCT_NAMES[i % PRODUCT_NAMES.length],
      unit: 'piece',
      price: randomPrice(50, 2500),
      weight: randomWeight(),
      technicalDescription: TECHNICAL_DESCRIPTIONS[i % TECHNICAL_DESCRIPTIONS.length],
      machineText: '',
      statistic: 'ET',
      featuredImage: {
        '@id': `/api/v1/media_items/${mediaId}`,
        '@type': 'MediaItem',
        id: mediaId,
        filename: `${name}-01-${Date.now().toString(16)}.jpg`,
        mimeType: 'image/jpeg',
        filePath: `/uploads/${name}-01-${Date.now().toString(16)}.jpg`,
        createdAt: createdDate.toISOString(),
        updatedAt: createdDate.toISOString()
      },
      createdAt: createdDate.toISOString(),
      updatedAt: updatedDate.toISOString(),
      imageGallery: [],
      documents: [],
      machines: []
    };

    products.push(product);
  }

  return products;
}

// Store generated products
const DUMMY_PRODUCTS = generateDummyProducts();

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor() {}

  /**
   * Get all products
   */
  getProducts(): Observable<ProductsCollection> {
    const collection: ProductsCollection = {
      '@context': '/api/v1/contexts/Product',
      '@id': '/api/v1/products',
      '@type': 'Collection',
      totalItems: DUMMY_PRODUCTS.length,
      member: DUMMY_PRODUCTS
    };

    // Simulate network delay
    return of(collection).pipe(delay(300));
  }

  /**
   * Get a single product by ID
   */
  getProductById(id: string): Observable<Product | undefined> {
    const product = DUMMY_PRODUCTS.find(p => p.id === id);
    return of(product).pipe(delay(200));
  }

  /**
   * Get products by part number search
   */
  searchProducts(query: string): Observable<Product[]> {
    const lowerQuery = query.toLowerCase();
    const filtered = DUMMY_PRODUCTS.filter(p =>
      p.partNo.toLowerCase().includes(lowerQuery) ||
      p.shortDescription.toLowerCase().includes(lowerQuery) ||
      p.name.toLowerCase().includes(lowerQuery)
    );
    return of(filtered).pipe(delay(200));
  }
}
