# Pasar Backend API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Versioning](#api-versioning)
4. [Rate Limiting](#rate-limiting)
5. [Error Handling](#error-handling)
6. [Authentication & Onboarding APIs](#authentication--onboarding-apis)
7. [Marketplace APIs](#marketplace-apis)
8. [Payment & Escrow APIs](#payment--escrow-apis)
9. [Wallet Management APIs](#wallet-management-apis)
10. [Dispute Resolution APIs](#dispute-resolution-apis)
11. [Ratings & Reviews APIs](#ratings--reviews-apis)
12. [Seller Dashboard APIs](#seller-dashboard-apis)
13. [Transaction Verification APIs](#transaction-verification-apis)
14. [Admin Dashboard APIs](#admin-dashboard-apis)
15. [Logistics (PasarMove) APIs](#logistics-pasarmove-apis)
16. [AI Agent Integration APIs](#ai-agent-integration-apis)
17. [Security & Fraud Prevention APIs](#security--fraud-prevention-apis)

---

## Overview

The Pasar Backend API provides a comprehensive RESTful interface for the hybrid Web2/Web3 marketplace platform. This API enables secure transactions with escrow protection, supporting both fiat and cryptocurrency payments.

**Base URL:** `https://api.pasar.com/v1`

**Supported Formats:** JSON

**Authentication:** Bearer Token (JWT)

---

## Authentication

All API endpoints require authentication using JWT tokens obtained through the authentication flow.

```http
Authorization: Bearer <jwt_token>
```

### Token Structure
```jsonc
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## API Versioning

The API uses URI versioning with the version number in the path:
- Current version: `v1`
- Future versions: `v2`, `v3`, etc.

---

## Rate Limiting

API requests are rate-limited per user:
- **Standard users:** 1000 requests/hour
- **Premium sellers:** 5000 requests/hour
- **Admin users:** 10000 requests/hour

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## Error Handling

### Standard Error Response Format
```jsonc
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The provided data is invalid",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Unprocessable Entity
- `429` - Rate Limited
- `500` - Internal Server Error

---

## Authentication & Onboarding APIs

### 1. User Registration

**POST** `/auth/register`

Register a new user (buyer or seller).

**Request Body:**
```jsonc
{
  "user_type": "seller", // "buyer" | "seller"
  "auth_method": "email", // "email" | "social" | "passkey"
  "email": "user@example.com",
  "password": "SecurePass123!",
  "social_provider": "google", // optional for social auth
  "social_token": "social_access_token" // optional for social auth
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "user_id": "usr_abc123",
    "user_type": "seller",
    "email": "user@example.com",
    "verification_required": true,
    "next_step": "complete_onboarding"
  },
  "tokens": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "expires_in": 3600
  }
}
```

### 2. User Login

**POST** `/auth/login`

Authenticate existing user.

**Request Body:**
```jsonc
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "remember_me": true
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "user_id": "usr_abc123",
    "user_type": "seller",
    "email": "user@example.com",
    "profile_complete": true,
    "wallet_address": "0x742d35Cc..."
  },
  "tokens": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "expires_in": 3600
  }
}
```

### 3. Complete Seller Onboarding

**POST** `/auth/seller/onboarding`

Complete seller profile and payout setup.

**Request Body:**
```jsonc
{
  "personal_info": {
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+234801234567",
    "website": "https://example.com",
    "state_of_origin": "Lagos",
    "country": "NG",
    "gender": "male"
  },
  "payout_method": "crypto", // "crypto" | "fiat"
  "payout_details": {
    // For crypto payout - wallet is auto-generated
    // For fiat payout:
    "bank_name": "First Bank",
    "account_number": "1234567890",
    "account_holder_name": "John Doe"
  }
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "profile_id": "prof_abc123",
    "wallet_address": "0x742d35Cc6eB58BcE89BF3f5...", // if crypto payout
    "payout_method": "crypto",
    "onboarding_complete": true
  }
}
```

### 4. Refresh Token

**POST** `/auth/refresh`

**Request Body:**
```jsonc
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

---

## Marketplace APIs

### 1. Get All Products

**GET** `/marketplace/products`

Retrieve paginated list of products with filters.

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `category` (string): Product category
- `min_price` (number): Minimum price filter
- `max_price` (number): Maximum price filter
- `payment_method` (string): "fiat" | "crypto" | "both"
- `seller_rating` (number): Minimum seller rating (1-5)
- `search` (string): Search query
- `tags` (string): Comma-separated tags
- `sort` (string): "price_asc" | "price_desc" | "rating" | "newest"

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "products": [
      {
        "product_id": "prod_abc123",
        "title": "iPhone 15 Pro",
        "description": "Latest iPhone with advanced features",
        "price": {
          "amount": 850000,
          "currency": "NGN",
          "crypto_equivalent": {
            "amount": 850,
            "currency": "USDT"
          }
        },
        "images": [
          "https://cdn.pasar.com/products/img1.jpg"
        ],
        "category": "electronics",
        "tags": ["trusted", "escrow_protected", "instant_delivery"],
        "seller": {
          "seller_id": "usr_seller123",
          "name": "Tech Store Lagos",
          "rating": 4.8,
          "total_orders": 245,
          "verification_status": "verified"
        },
        "payment_options": ["fiat", "crypto"],
        "estimated_delivery": "2-3 days",
        "stock_quantity": 5,
        "created_at": "2025-01-10T09:00:00Z",
        "updated_at": "2025-01-15T12:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 25,
      "total_items": 500,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 2. Get Product Details

**GET** `/marketplace/products/{product_id}`

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "product_id": "prod_abc123",
    "title": "iPhone 15 Pro",
    "description": "Latest iPhone with advanced features...",
    "detailed_description": "Full HTML description...",
    "price": {
      "amount": 850000,
      "currency": "NGN",
      "crypto_equivalent": {
        "amount": 850,
        "currency": "USDT"
      }
    },
    "images": [
      {
        "url": "https://cdn.pasar.com/products/img1.jpg",
        "alt": "iPhone front view",
        "is_primary": true
      }
    ],
    "specifications": {
      "brand": "Apple",
      "model": "iPhone 15 Pro",
      "storage": "256GB",
      "color": "Natural Titanium"
    },
    "seller": {
      "seller_id": "usr_seller123",
      "name": "Tech Store Lagos",
      "rating": 4.8,
      "total_orders": 245,
      "response_time": "< 1 hour",
      "verification_status": "verified",
      "location": "Lagos, Nigeria"
    },
    "reviews_summary": {
      "total_reviews": 45,
      "average_rating": 4.6,
      "rating_distribution": {
        "5": 30,
        "4": 10,
        "3": 3,
        "2": 1,
        "1": 1
      }
    },
    "shipping_info": {
      "estimated_delivery": "2-3 days",
      "shipping_cost": 5000,
      "free_shipping_threshold": 100000
    },
    "escrow_info": {
      "escrow_protected": true,
      "band": "C",
      "hold_duration": "48 hours"
    }
  }
}
```

### 3. Create Product (Seller)

**POST** `/marketplace/products`

**Request Body:**
```jsonc
{
  "title": "iPhone 15 Pro",
  "description": "Latest iPhone with advanced features",
  "detailed_description": "<p>Full HTML description...</p>",
  "category": "electronics",
  "price": {
    "amount": 850000,
    "currency": "NGN"
  },
  "specifications": {
    "brand": "Apple",
    "model": "iPhone 15 Pro",
    "storage": "256GB",
    "color": "Natural Titanium"
  },
  "images": [
    "base64_encoded_image_1",
    "base64_encoded_image_2"
  ],
  "stock_quantity": 5,
  "payment_methods": ["fiat", "crypto"],
  "estimated_delivery_days": 3,
  "shipping_cost": 5000,
  "tags": ["new", "warranty"]
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "product_id": "prod_abc123",
    "title": "iPhone 15 Pro",
    "status": "active",
    "created_at": "2025-01-15T10:30:00Z",
    "ghiblify_version": "https://cdn.pasar.com/ghibli/prod_abc123.gif"
  }
}
```

---

## Payment & Escrow APIs

### 1. Initiate Purchase

**POST** `/payments/purchase`

**Request Body:**
```jsonc
{
  "product_id": "prod_abc123",
  "quantity": 1,
  "payment_method": "crypto", // "fiat" | "crypto"
  "delivery_address": {
    "street": "123 Lagos Street",
    "city": "Lagos",
    "state": "Lagos",
    "country": "Nigeria",
    "postal_code": "100001",
    "phone": "+234801234567"
  },
  "buyer_notes": "Please handle with care"
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "order_id": "ord_abc123",
    "pasar_transaction_id": "ptx_abc123",
    "total_amount": {
      "amount": 855000, // including shipping
      "currency": "NGN",
      "crypto_equivalent": {
        "amount": 855,
        "currency": "USDT"
      }
    },
    "escrow_band": "C",
    "escrow_duration": "48 hours",
    "payment_details": {
      "payment_method": "crypto",
      "wallet_address": "0x742d35Cc6eB58BcE89BF3f5...",
      "required_amount": "855.00",
      "currency": "USDT",
      "network": "Ethereum",
      "deadline": "2025-01-15T11:30:00Z"
    }
  }
}
```

### 2. Confirm Payment

**POST** `/payments/{order_id}/confirm`

**Request Body:**
```jsonc
{
  "transaction_hash": "0x1234567890abcdef...",
  "network": "ethereum"
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "order_id": "ord_abc123",
    "payment_status": "confirmed",
    "blockchain_confirmations": 3,
    "escrow_locked": true,
    "next_step": "await_seller_shipment"
  }
}
```

### 3. Get Escrow Status

**GET** `/escrow/{order_id}/status`

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "order_id": "ord_abc123",
    "escrow_status": "locked",
    "amount": {
      "amount": 855,
      "currency": "USDT"
    },
    "band": "C",
    "lock_time": "2025-01-15T10:30:00Z",
    "release_time": "2025-01-17T10:30:00Z",
    "time_remaining": "47h 23m",
    "can_dispute": true,
    "blockchain_tx": "0x1234567890abcdef..."
  }
}
```

---

## Wallet Management APIs

### 1. Get Wallet Balance

**GET** `/wallet/balance`

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "wallet_address": "0x742d35Cc6eB58BcE89BF3f5...",
    "balances": [
      {
        "token": "USDT",
        "balance": "1250.50",
        "usd_value": 1250.50,
        "contract_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
      },
      {
        "token": "USDC",
        "balance": "750.00",
        "usd_value": 750.00,
        "contract_address": "0xA0b86a33E6c885E0AaA33E53A85C7b5cFb07A73f"
      },
      {
        "token": "ETH",
        "balance": "0.5",
        "usd_value": 1650.00,
        "contract_address": "native"
      }
    ],
    "total_usd_value": 3650.50,
    "last_updated": "2025-01-15T10:30:00Z"
  }
}
```

### 2. Transfer Funds

**POST** `/wallet/transfer`

**Request Body:**
```jsonc
{
  "to_address": "0x1234567890abcdef...",
  "amount": "100.50",
  "token": "USDT",
  "note": "Payment for services",
  "password": "wallet_password"
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "transaction_id": "tx_abc123",
    "transaction_hash": "0x9876543210fedcba...",
    "status": "pending",
    "estimated_confirmation_time": "2-5 minutes",
    "gas_fee": "0.002 ETH"
  }
}
```

### 3. Get Transaction History

**GET** `/wallet/transactions`

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `type` (string): "sent" | "received" | "all"
- `token` (string): Filter by token symbol

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "transactions": [
      {
        "transaction_id": "tx_abc123",
        "transaction_hash": "0x9876543210fedcba...",
        "type": "sent",
        "amount": "100.50",
        "token": "USDT",
        "to_address": "0x1234567890abcdef...",
        "from_address": "0x742d35Cc6eB58BcE89BF3f5...",
        "status": "confirmed",
        "confirmations": 12,
        "gas_fee": "0.002 ETH",
        "timestamp": "2025-01-15T09:00:00Z",
        "note": "Payment for services"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 100
    }
  }
}
```

---

## Dispute Resolution APIs

### 1. Initiate Dispute

**POST** `/disputes`

**Request Body:**
```jsonc
{
  "order_id": "ord_abc123",
  "reason": "item_not_as_described",
  "description": "The received item has significant differences from the listing",
  "evidence_images": [
    "base64_encoded_image_1",
    "base64_encoded_image_2"
  ]
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "dispute_id": "disp_abc123",
    "order_id": "ord_abc123",
    "status": "open",
    "band": "C",
    "arbitrator": "ai", // "ai" | "human"
    "estimated_resolution_time": "24-48 hours",
    "evidence_uploaded": true,
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

### 2. Get Dispute Status

**GET** `/disputes/{dispute_id}`

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "dispute_id": "disp_abc123",
    "order_id": "ord_abc123",
    "status": "in_review",
    "reason": "item_not_as_described",
    "description": "The received item has significant differences from the listing",
    "arbitrator": "ai",
    "evidence": {
      "buyer_images": [
        "https://cdn.pasar.com/disputes/buyer_evidence_1.jpg"
      ],
      "seller_images": [
        "https://cdn.pasar.com/products/original_listing_1.jpg"
      ],
      "ghiblify_comparison": "https://cdn.pasar.com/ghibli/comparison_abc123.gif"
    },
    "timeline": [
      {
        "event": "dispute_created",
        "timestamp": "2025-01-15T10:30:00Z",
        "actor": "buyer"
      },
      {
        "event": "evidence_uploaded",
        "timestamp": "2025-01-15T10:32:00Z",
        "actor": "buyer"
      },
      {
        "event": "ai_analysis_started",
        "timestamp": "2025-01-15T10:35:00Z",
        "actor": "system"
      }
    ],
    "estimated_resolution": "2025-01-16T10:30:00Z"
  }
}
```

### 3. Resolve Dispute (AI/Admin)

**POST** `/disputes/{dispute_id}/resolve`

**Request Body:**
```jsonc
{
  "verdict": "favor_buyer", // "favor_buyer" | "favor_seller"
  "reasoning": "Image analysis shows significant discrepancies between listing and received item",
  "confidence_score": 0.85,
  "refund_amount": "855.00",
  "penalty_applied": true
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "dispute_id": "disp_abc123",
    "resolution": "favor_buyer",
    "refund_transaction": "0x1234567890abcdef...",
    "penalty_applied": true,
    "resolution_time": "2025-01-15T14:30:00Z",
    "blockchain_recorded": true
  }
}
```

---

## Ratings & Reviews APIs

### 1. Submit Review

**POST** `/reviews`

**Request Body:**
```jsonc
{
  "order_id": "ord_abc123",
  "seller_id": "usr_seller123",
  "rating": 5,
  "review_text": "Excellent seller, fast delivery and product as described",
  "review_images": [
    "base64_encoded_image_1"
  ],
  "delivery_rating": 4,
  "communication_rating": 5
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "review_id": "rev_abc123",
    "status": "published", // "published" | "pending_moderation"
    "seller_updated_rating": 4.8,
    "reputation_score_impact": "+0.02"
  }
}
```

### 2. Get Product Reviews

**GET** `/products/{product_id}/reviews`

**Query Parameters:**
- `page` (integer): Page number
- `rating_filter` (integer): Filter by star rating (1-5)
- `sort` (string): "newest" | "oldest" | "helpful"

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "reviews": [
      {
        "review_id": "rev_abc123",
        "buyer_name": "John D.", // anonymized
        "rating": 5,
        "review_text": "Excellent seller, fast delivery and product as described",
        "review_images": [
          "https://cdn.pasar.com/reviews/rev_abc123_img1.jpg"
        ],
        "verified_purchase": true,
        "helpful_votes": 12,
        "created_at": "2025-01-10T15:30:00Z",
        "delivery_rating": 4,
        "communication_rating": 5
      }
    ],
    "summary": {
      "total_reviews": 45,
      "average_rating": 4.6,
      "rating_distribution": {
        "5": 30,
        "4": 10,
        "3": 3,
        "2": 1,
        "1": 1
      }
    }
  }
}
```

### 3. Get Seller Reputation

**GET** `/sellers/{seller_id}/reputation`

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "seller_id": "usr_seller123",
    "reputation_score": 4.8,
    "total_orders": 245,
    "completed_orders": 240,
    "dispute_ratio": 0.02,
    "average_delivery_time": "2.3 days",
    "response_time": "< 1 hour",
    "ratings_breakdown": {
      "5_stars": 200,
      "4_stars": 35,
      "3_stars": 5,
      "2_stars": 0,
      "1_stars": 0
    },
    "badges": ["trusted_seller", "fast_responder", "top_rated"],
    "last_activity": "2025-01-15T08:00:00Z",
    "reputation_trend": "improving" // "improving" | "stable" | "declining"
  }
}
```

---

## Seller Dashboard APIs

### 1. Get Dashboard Overview

**GET** `/sellers/dashboard`

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "quick_stats": {
      "total_earnings": {
        "amount": 2450000,
        "currency": "NGN",
        "crypto_equivalent": {
          "amount": 2450,
          "currency": "USDT"
        }
      },
      "total_orders": 245,
      "pending_orders": 5,
      "current_rating": 4.8,
      "wallet_balance": {
        "amount": 1250.50,
        "currency": "USDT"
      },
      "pending_disputes": 0
    },
    "recent_orders": [
      {
        "order_id": "ord_abc123",
        "product_title": "iPhone 15 Pro",
        "buyer_name": "John D.",
        "amount": 855000,
        "status": "shipped",
        "created_at": "2025-01-15T09:00:00Z"
      }
    ],
    "performance_metrics": {
      "orders_this_month": 28,
      "revenue_this_month": 450000,
      "average_order_value": 16071,
      "conversion_rate": 0.15
    },
    "notifications": [
      {
        "type": "new_order",
        "message": "New order received for iPhone 15 Pro",
        "timestamp": "2025-01-15T10:30:00Z",
        "read": false
      }
    ]
  }
}
```

### 2. Get Seller Orders

**GET** `/sellers/orders`

**Query Parameters:**
- `status` (string): "pending" | "paid" | "shipped" | "delivered" | "disputed" | "cancelled"
- `page` (integer): Page number
- `limit` (integer): Items per page
- `date_from` (string): Start date (ISO format)
- `date_to` (string): End date (ISO format)

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "orders": [
      {
        "order_id": "ord_abc123",
        "pasar_transaction_id": "ptx_abc123",
        "product": {
          "product_id": "prod_abc123",
          "title": "iPhone 15 Pro",
          "image": "https://cdn.pasar.com/products/thumb_abc123.jpg"
        },
        "buyer": {
          "name": "John D.", // anonymized
          "location": "Lagos, Nigeria"
        },
        "amount": {
          "amount": 855000,
          "currency": "NGN",
          "crypto_equivalent": {
            "amount": 855,
            "currency": "USDT"
          }
        },
        "quantity": 1,
        "status": "shipped",
        "payment_status": "confirmed",
        "escrow_status": "locked",
        "delivery_address": {
          "street": "****** Street", // masked for privacy
          "city": "Lagos",
          "state": "Lagos",
          "country": "Nigeria"
        },
        "tracking_code": "TRK123456789",
        "delivery_code": "DEL789123",
        "estimated_delivery": "2025-01-17T15:00:00Z",
        "created_at": "2025-01-15T09:00:00Z",
        "shipped_at": "2025-01-15T14:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 12,
      "total_items": 245
    }
  }
}
```

### 3. Update Order Status

**PUT** `/sellers/orders/{order_id}/status`

**Request Body:**
```jsonc
{
  "status": "shipped",
  "tracking_code": "TRK123456789",
  "estimated_delivery": "2025-01-17T15:00:00Z",
  "notes": "Package has been dispatched via PasarMove"
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "order_id": "ord_abc123",
    "status": "shipped",
    "tracking_code": "TRK123456789",
    "buyer_notified": true,
    "updated_at": "2025-01-15T14:00:00Z"
  }
}
```

---

## Transaction Verification APIs

### 1. Get Transaction Details (PasarScan)

**GET** `/transactions/{transaction_id}`

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "pasar_transaction_id": "ptx_abc123",
    "blockchain_hash": "0x1234567890abcdef...",
    "contract_address": "0x742d35Cc6eB58BcE89BF3f5...",
    "from_address": "0x1111111111111111...",
    "to_address": "0x2222222222222222...",
    "status": "completed",
    "amount": {
      "amount": 855,
      "currency": "USDT",
      "fiat_equivalent": {
        "amount": 855000,
        "currency": "NGN"
      }
    },
    "escrow_band": "C",
    "escrow_duration": "48 hours",
    "network": "ethereum",
    "confirmations": 15,
    "gas_fee": "0.002 ETH",
    "timestamps": {
      "initiated": "2025-01-15T10:00:00Z",
      "confirmed": "2025-01-15T10:05:00Z",
      "escrowed": "2025-01-15T10:05:30Z",
      "completed": "2025-01-17T10:05:30Z"
    },
    "order_details": {
      "order_id": "ord_abc123",
      "product_title": "iPhone 15 Pro",
      "seller_name": "Tech Store Lagos",
      "buyer_name": "John D."
    },
    "external_links": {
      "etherscan": "https://etherscan.io/tx/0x1234567890abcdef...",
      "basescan": "https://basescan.org/tx/0x1234567890abcdef..."
    }
  }
}
```

### 2. Search Transactions

**GET** `/transactions/search`

**Query Parameters:**
- `q` (string): Search by Pasar Transaction ID or Blockchain Hash
- `address` (string): Filter by wallet address
- `status` (string): Filter by status
- `date_from` (string): Start date
- `date_to` (string): End date

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "transactions": [
      {
        "pasar_transaction_id": "ptx_abc123",
        "blockchain_hash": "0x1234567890abcdef...",
        "status": "completed",
        "amount": "855.00 USDT",
        "timestamp": "2025-01-15T10:00:00Z",
        "order_id": "ord_abc123"
      }
    ],
    "total_results": 1
  }
}
```

---

## Admin Dashboard APIs

### 1. Get Admin Dashboard Overview

**GET** `/admin/dashboard`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "platform_stats": {
      "total_users": 15420,
      "active_users_24h": 1240,
      "total_sellers": 3280,
      "total_buyers": 12140,
      "total_orders": 45680,
      "gmv_today": {
        "amount": 12500000,
        "currency": "NGN"
      },
      "gmv_this_month": {
        "amount": 450000000,
        "currency": "NGN"
      }
    },
    "escrow_stats": {
      "total_locked": {
        "amount": 2500000,
        "currency": "NGN",
        "crypto_equivalent": {
          "amount": 2500,
          "currency": "USDT"
        }
      },
      "pending_releases": 125,
      "band_distribution": {
        "A": 5,
        "B": 12,
        "C": 45,
        "D": 63
      }
    },
    "dispute_stats": {
      "open_disputes": 23,
      "pending_ai_resolution": 15,
      "pending_admin_resolution": 8,
      "resolved_today": 12,
      "average_resolution_time": "18 hours"
    },
    "security_alerts": [
      {
        "type": "high_risk_login",
        "count": 3,
        "description": "Multiple failed login attempts detected"
      }
    ]
  }
}
```

### 2. User Management

**GET** `/admin/users`

**Query Parameters:**
- `type` (string): "buyer" | "seller" | "all"
- `status` (string): "active" | "suspended" | "banned"
- `search` (string): Search by name, email, or ID
- `page` (integer): Page number
- `limit` (integer): Items per page

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "users": [
      {
        "user_id": "usr_abc123",
        "type": "seller",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+234801234567",
        "status": "active",
        "verification_status": "verified",
        "reputation_score": 4.8,
        "total_orders": 245,
        "wallet_address": "0x742d35Cc6eB58BcE89BF3f5...",
        "last_login": "2025-01-15T08:00:00Z",
        "created_at": "2024-06-15T10:00:00Z",
        "flags": ["high_volume_seller"],
        "risk_score": 0.1
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 154,
      "total_items": 15420
    }
  }
}
```

### 3. Suspend/Ban User

**PUT** `/admin/users/{user_id}/status`

**Request Body:**
```jsonc
{
  "action": "suspend", // "suspend" | "ban" | "activate"
  "reason": "Multiple dispute violations",
  "duration_hours": 168, // 7 days, null for permanent
  "notify_user": true
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "user_id": "usr_abc123",
    "previous_status": "active",
    "new_status": "suspended",
    "suspension_until": "2025-01-22T10:30:00Z",
    "user_notified": true
  }
}
```

### 4. Dispute Management

**GET** `/admin/disputes`

**Query Parameters:**
- `status` (string): "open" | "in_review" | "resolved"
- `arbitrator` (string): "ai" | "human"
- `band` (string): "A" | "B" | "C" | "D"
- `priority` (string): "high" | "medium" | "low"

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "disputes": [
      {
        "dispute_id": "disp_abc123",
        "order_id": "ord_abc123",
        "status": "in_review",
        "band": "B",
        "arbitrator": "human",
        "priority": "high",
        "amount": {
          "amount": 1200000,
          "currency": "NGN"
        },
        "reason": "item_not_as_described",
        "buyer_id": "usr_buyer123",
        "seller_id": "usr_seller123",
        "evidence_count": 4,
        "ai_confidence": null,
        "assigned_admin": "admin_john",
        "created_at": "2025-01-15T09:00:00Z",
        "sla_deadline": "2025-01-17T09:00:00Z"
      }
    ],
    "summary": {
      "total_open": 23,
      "overdue": 2,
      "high_priority": 5
    }
  }
}
```

### 5. Manual Dispute Resolution

**POST** `/admin/disputes/{dispute_id}/resolve`

**Request Body:**
```jsonc
{
  "verdict": "favor_buyer",
  "reasoning": "After reviewing evidence, the item significantly differs from the listing description",
  "refund_percentage": 100,
  "seller_penalty": {
    "type": "warning",
    "points": 10
  },
  "additional_notes": "Seller advised to improve listing accuracy"
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "dispute_id": "disp_abc123",
    "resolution": "favor_buyer",
    "refund_amount": "1200000 NGN",
    "refund_transaction": "0x9876543210fedcba...",
    "seller_penalty_applied": true,
    "both_parties_notified": true,
    "resolved_at": "2025-01-15T14:30:00Z"
  }
}
```

---

## Logistics (PasarMove) APIs

### 1. Assign Dispatch Rider

**POST** `/logistics/assign-rider`

**Request Body:**
```jsonc
{
  "order_id": "ord_abc123",
  "pickup_address": {
    "street": "123 Seller Street",
    "city": "Lagos",
    "state": "Lagos",
    "country": "Nigeria",
    "postal_code": "100001",
    "contact_phone": "+234801111111"
  },
  "delivery_address": {
    "street": "456 Buyer Avenue",
    "city": "Lagos",
    "state": "Lagos", 
    "country": "Nigeria",
    "postal_code": "100002",
    "contact_phone": "+234802222222"
  },
  "priority": "standard", // "standard" | "express" | "same_day"
  "package_details": {
    "weight_kg": 0.5,
    "dimensions": "20x15x5 cm",
    "fragile": true,
    "declared_value": 855000
  }
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "assignment_id": "asgn_abc123",
    "order_id": "ord_abc123",
    "rider": {
      "rider_id": "rider_123",
      "name": "Ahmed Bello",
      "phone": "+234803333333",
      "rating": 4.7,
      "vehicle_type": "motorcycle",
      "estimated_pickup": "2025-01-15T16:00:00Z"
    },
    "tracking_code": "TRK123456789",
    "delivery_code": "DEL789123",
    "estimated_delivery": "2025-01-16T10:00:00Z",
    "delivery_fee": 2500
  }
}
```

### 2. Track Delivery

**GET** `/logistics/track/{tracking_code}`

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "tracking_code": "TRK123456789",
    "order_id": "ord_abc123",
    "status": "in_transit",
    "current_location": {
      "latitude": 6.5244,
      "longitude": 3.3792,
      "address": "Victoria Island, Lagos"
    },
    "rider": {
      "name": "Ahmed Bello",
      "phone": "+234803333333",
      "rating": 4.7
    },
    "timeline": [
      {
        "status": "assigned",
        "timestamp": "2025-01-15T14:00:00Z",
        "location": "PasarMove Hub Lagos"
      },
      {
        "status": "picked_up",
        "timestamp": "2025-01-15T16:30:00Z",
        "location": "123 Seller Street, Lagos"
      },
      {
        "status": "in_transit",
        "timestamp": "2025-01-15T17:00:00Z",
        "location": "Victoria Island, Lagos"
      }
    ],
    "estimated_delivery": "2025-01-16T10:00:00Z",
    "delivery_instructions": "Call on arrival"
  }
}
```

### 3. Confirm Delivery

**POST** `/logistics/deliveries/{tracking_code}/confirm`

**Request Body:**
```jsonc
{
  "delivery_code": "DEL789123",
  "rider_id": "rider_123",
  "delivery_location": {
    "latitude": 6.4281,
    "longitude": 3.4219
  },
  "proof_of_delivery": "base64_encoded_image",
  "notes": "Delivered to buyer directly"
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "tracking_code": "TRK123456789",
    "delivery_confirmed": true,
    "delivered_at": "2025-01-16T09:45:00Z",
    "escrow_release_triggered": true,
    "buyer_prompt_sent": true,
    "proof_of_delivery_url": "https://cdn.pasar.com/logistics/pod_abc123.jpg"
  }
}
```

---

## AI Agent Integration APIs

### 1. Xiara - Conversational Commerce

**POST** `/ai/xiara/chat`

**Request Body:**
```jsonc
{
  "user_id": "usr_buyer123",
  "message": "I'm looking for an iPhone under 800,000 naira",
  "context": {
    "conversation_id": "conv_abc123",
    "previous_searches": ["smartphones", "apple"],
    "budget_range": {
      "min": 500000,
      "max": 800000,
      "currency": "NGN"
    }
  }
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "conversation_id": "conv_abc123",
    "response": {
      "message": "I found several iPhones within your budget! Here are the top 3 options:",
      "type": "product_recommendations",
      "products": [
        {
          "product_id": "prod_iphone13",
          "title": "iPhone 13 128GB",
          "price": 720000,
          "seller_rating": 4.9,
          "match_score": 0.95
        }
      ],
      "suggested_actions": [
        {
          "action": "view_product",
          "product_id": "prod_iphone13",
          "label": "View iPhone 13 Details"
        },
        {
          "action": "negotiate_price",
          "product_id": "prod_iphone13", 
          "label": "Negotiate Price"
        }
      ]
    },
    "context_updated": true
  }
}
```

### 2. Xena - Wallet Assistant

**POST** `/ai/xena/command`

**Request Body:**
```jsonc
{
  "user_id": "usr_seller123",
  "command": "transfer 100 USDT to 0x1234567890abcdef every Sunday",
  "command_type": "voice", // "voice" | "text"
  "wallet_password": "wallet_password"
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "command_id": "cmd_abc123",
    "interpretation": {
      "action": "schedule_recurring_transfer",
      "amount": "100",
      "currency": "USDT",
      "recipient": "0x1234567890abcdef",
      "frequency": "weekly",
      "day": "sunday"
    },
    "confirmation_required": true,
    "estimated_gas": "0.002 ETH per transaction",
    "schedule_start": "2025-01-19T00:00:00Z",
    "response": "I'll set up a recurring transfer of 100 USDT every Sunday. This will cost approximately 0.002 ETH in gas fees per transaction. Would you like me to proceed?"
  }
}
```

### 3. Shogun - Security Alerts

**GET** `/ai/shogun/alerts`

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "active_alerts": [
      {
        "alert_id": "alert_abc123",
        "type": "suspicious_login",
        "severity": "high",
        "user_id": "usr_suspicious123",
        "description": "Multiple failed login attempts from different IP addresses",
        "detection_time": "2025-01-15T10:30:00Z",
        "actions_taken": [
          "account_temporarily_locked",
          "admin_notification_sent"
        ],
        "risk_score": 0.85,
        "details": {
          "failed_attempts": 15,
          "ip_addresses": ["192.168.1.1", "10.0.0.1", "172.16.0.1"],
          "countries": ["Nigeria", "Unknown", "Ghana"]
        }
      }
    ],
    "resolved_alerts_24h": 23,
    "total_active": 5
  }
}
```

### 4. Resolute Engine - AI Dispute Analysis

**POST** `/ai/resolute/analyze`

**Request Body:**
```jsonc
{
  "dispute_id": "disp_abc123",
  "evidence": {
    "seller_images": ["img_url_1", "img_url_2"],
    "buyer_images": ["img_url_3", "img_url_4"],
    "ghiblify_comparison": "gif_url",
    "buyer_description": "The item received has scratches and doesn't match the condition described"
  }
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "analysis_id": "analysis_abc123",
    "dispute_id": "disp_abc123",
    "verdict": "favor_buyer",
    "confidence_score": 0.87,
    "reasoning": {
      "image_analysis": "Significant discrepancies detected between listing and received item images",
      "condition_assessment": "Item shows wear not disclosed in original listing",
      "credibility_score": {
        "seller": 0.3,
        "buyer": 0.8
      }
    },
    "recommended_action": {
      "refund_percentage": 85,
      "seller_penalty": "warning",
      "reasoning": "Partial refund recommended due to condition discrepancy"
    },
    "processing_time": "2.3 seconds",
    "requires_human_review": false
  }
}
```

---

## Security & Fraud Prevention APIs

### 1. Report Fraud

**POST** `/security/fraud-report`

**Request Body:**
```jsonc
{
  "reporter_id": "usr_abc123",
  "reported_entity": "user", // "user" | "product" | "transaction"
  "entity_id": "usr_fraud123",
  "fraud_type": "fake_products", // "fake_products" | "payment_fraud" | "identity_theft" | "scam"
  "description": "Seller is listing counterfeit products as genuine",
  "evidence": [
    "base64_encoded_image_1",
    "base64_encoded_image_2"
  ],
  "severity": "high" // "low" | "medium" | "high" | "critical"
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "report_id": "fraud_abc123",
    "status": "under_investigation",
    "priority": "high",
    "assigned_investigator": "security_team_1",
    "estimated_resolution": "48-72 hours",
    "reference_number": "FR-2025-0001",
    "automated_actions": [
      "account_flagged",
      "products_under_review"
    ]
  }
}
```

### 2. Get Security Score

**GET** `/security/users/{user_id}/score`

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "user_id": "usr_abc123",
    "security_score": 0.92, // 0-1 scale, higher is better
    "risk_level": "low", // "low" | "medium" | "high" | "critical"
    "factors": {
      "account_age": {
        "score": 0.9,
        "days": 245
      },
      "transaction_history": {
        "score": 0.95,
        "successful_transactions": 180,
        "disputed_transactions": 2
      },
      "verification_status": {
        "score": 1.0,
        "email_verified": true,
        "phone_verified": true,
        "kyc_completed": true
      },
      "behavioral_patterns": {
        "score": 0.88,
        "login_consistency": 0.9,
        "ip_reputation": 0.85
      }
    },
    "recent_flags": [],
    "last_updated": "2025-01-15T10:30:00Z"
  }
}
```

### 3. Block/Unblock IP Address

**POST** `/security/ip-management`

**Request Body:**
```jsonc
{
  "action": "block", // "block" | "unblock"
  "ip_address": "192.168.1.100",
  "reason": "Multiple fraud attempts",
  "duration_hours": 24, // null for permanent
  "notify_admin": true
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "ip_address": "192.168.1.100",
    "status": "blocked",
    "blocked_until": "2025-01-16T10:30:00Z",
    "reason": "Multiple fraud attempts",
    "admin_notified": true,
    "affected_sessions": 3
  }
}
```

---

## WebSocket APIs

For real-time features, Pasar uses WebSocket connections:

### Connection
```javascript
wss://ws.pasar.com/v1/connect?token=<jwt_token>
```

### Message Types

#### Order Updates
```jsonc
{
  "type": "order_update",
  "data": {
    "order_id": "ord_abc123",
    "status": "shipped",
    "tracking_code": "TRK123456789",
    "timestamp": "2025-01-15T14:00:00Z"
  }
}
```

#### Dispute Notifications
```jsonc
{
  "type": "dispute_update",
  "data": {
    "dispute_id": "disp_abc123",
    "status": "resolved",
    "verdict": "favor_buyer",
    "timestamp": "2025-01-15T16:00:00Z"
  }
}
```

#### Chat Messages
```jsonc
{
  "type": "chat_message",
  "data": {
    "conversation_id": "conv_abc123",
    "sender_id": "usr_buyer123",
    "message": "Is this item still available?",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

---

## Webhooks

Pasar supports webhooks for external integrations:

### Webhook Configuration

**POST** `/webhooks`

**Request Body:**
```jsonc
{
  "url": "https://external-system.com/webhook",
  "events": ["order.completed", "dispute.resolved", "payment.confirmed"],
  "secret": "webhook_secret_key",
  "active": true
}
```

### Webhook Payload Example
```jsonc
{
  "event": "order.completed",
  "data": {
    "order_id": "ord_abc123",
    "amount": 855000,
    "currency": "NGN",
    "buyer_id": "usr_buyer123",
    "seller_id": "usr_seller123",
    "completed_at": "2025-01-15T16:00:00Z"
  },
  "timestamp": "2025-01-15T16:00:01Z",
  "signature": "sha256=abc123..."
}
```

---

## SDK Examples

### JavaScript/Node.js
```javascript
const PasarAPI = require('@pasar/sdk');

const pasar = new PasarAPI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.pasar.com/v1',
  environment: 'production' // 'sandbox' | 'production'
});

// Get products
const products = await pasar.marketplace.getProducts({
  category: 'electronics',
  maxPrice: 1000000
});

// Create order
const order = await pasar.payments.createOrder({
  productId: 'prod_abc123',
  quantity: 1,
  paymentMethod: 'crypto'
});
```

---

## Testing

### Sandbox Environment
**Base URL:** `https://api-sandbox.pasar.com/v1`

### Test Credentials
- Test Buyer: `buyer@test.pasar.com` / `TestPass123!`
- Test Seller: `seller@test.pasar.com` / `TestPass123!`
- Test Admin: `admin@test.pasar.com` / `TestPass123!`

### Test Data
The sandbox includes:
- 50 test products across various categories
- 100 test users (buyers and sellers)
- 200 completed test transactions
- 10 sample disputes in various states

### Test Payment Methods
- **Fiat:** Use card number `4111111111111111` (Visa Test)
- **Crypto:** Sepolia testnet USDT at `0x123...` (test tokens available)

---

## Rate Limits & Quotas

| User Type | Requests/Hour | Burst Limit | WebSocket Connections |
|-----------|---------------|-------------|----------------------|
| Buyer | 1,000 | 100/min | 5 |
| Seller | 2,500 | 250/min | 10 |
| Premium Seller | 5,000 | 500/min | 25 |
| Admin | 10,000 | 1000/min | 50 |

---

## Support & Resources

### Documentation Links
- **API Reference:** https://docs.pasar.com/api
- **SDK Documentation:** https://docs.pasar.com/sdk
- **Webhook Guide:** https://docs.pasar.com/webhooks
- **Security Best Practices:** https://docs.pasar.com/security

### Developer Support
- **Email:** developers@pasar.com
- **Slack Community:** https://pasar-developers.slack.com
- **Status Page:** https://status.pasar.com

### Change Log
- **v1.2.0** (2025-01-15): Added AI agent endpoints, enhanced dispute resolution
- **v1.1.0** (2025-01-01): Added logistics APIs, improved wallet management
- **v1.0.0** (2024-12-01): Initial API release

---

*This documentation is maintained by the Pasar Development Team. For questions or suggestions, please contact developers@pasar.com*
