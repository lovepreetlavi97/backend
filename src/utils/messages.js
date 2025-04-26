// messages.js
const messages = {
  // ===== User Management =====
  USER_CREATED: "User created successfully",
  USER_CREATION_FAILED: "Failed to create user",
  USERS_RETRIEVED: "Users retrieved successfully",
  USERS_RETRIEVAL_FAILED: "Failed to retrieve users",
  USER_RETRIEVED: "User retrieved successfully",
  USER_NOT_FOUND: "User not found",
  USER_RETRIEVAL_FAILED: "Failed to retrieve user",
  USER_UPDATED: "User updated successfully",
  USER_UPDATE_FAILED: "Failed to update user",
  USER_DELETED: "User deleted successfully",
  USER_DELETION_FAILED: "Failed to delete user",
  USER_BLOCKED: "Your account has been blocked. Please contact support.",
  
  // ===== Authentication =====
  PHONE_REQUIRED: "Phone number is required",
  EMAIL_PASSWORD_REQUIRED: "Email and password are required",
  EMAIL_ALREADY_EXISTS: "This email is already registered",
  PHONE_ALREADY_EXISTS: "This phone number is already registered",
  INVALID_CREDENTIALS: "Invalid email or password",
  LOGIN_SUCCESSFUL: "Login successful",
  LOGIN_FAILED: "Login failed",
  LOGOUT_SUCCESSFUL: "Logout successful",
  LOGOUT_FAILED: "Failed to logout",
  OTP_SENT: "OTP sent successfully",
  OTP_VERIFIED: "OTP verified successfully",
  OTP_INVALID: "Invalid OTP",
  OTP_SEND_FAILED: "Failed to send OTP",
  OTP_VERIFY_FAILED: "Failed to verify OTP",
  
  // ===== Admin & SuperAdmin =====
  ADMIN_CREATED: "Admin created successfully",
  ADMIN_CREATION_FAILED: "Failed to create admin",
  ADMINS_RETRIEVED: "Admins retrieved successfully",
  ADMIN_RETRIEVED: "Admin retrieved successfully",
  ADMIN_NOT_FOUND: "Admin not found",
  ADMIN_UPDATED: "Admin updated successfully",
  ADMIN_UPDATE_FAILED: "Failed to update admin",
  ADMIN_DELETED: "Admin deleted successfully",
  ADMIN_DELETION_FAILED: "Failed to delete admin",
  SUPERADMIN_CREATED: "SuperAdmin created successfully",
  SUPERADMIN_EXISTS: "A SuperAdmin already exists",
  INVALID_SECRET_KEY: "Invalid secret key",
  
  // ===== Common =====
  COUNT_OF_WISHLISTANDCART: "Counts fetched successfully",
  COUNTS_RETRIEVED: "Counts retrieved successfully",
  COUNTS_RETRIEVAL_FAILED: "Failed to retrieve counts",
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  
  // ===== Category Management =====
  CATEGORY_CREATED: "Category created successfully",
  CATEGORY_NOT_FOUND: "Category not found",
  CATEGORY_RETRIEVED: "Category retrieved successfully",
  CATEGORIES_RETRIEVED: "Categories retrieved successfully",
  CATEGORIES_NOT_FOUND: "No categories found",
  CATEGORIES_RETRIEVAL_FAILED: "Failed to retrieve categories",
  CATEGORY_UPDATED: "Category updated successfully",
  CATEGORY_UPDATE_FAILED: "Failed to update category",
  CATEGORY_DELETED: "Category deleted successfully",
  CATEGORY_DELETE_FAILED: "Failed to delete category",
  
  // ===== Subcategory Management =====
  SUBCATEGORY_CREATED: "Subcategory created successfully",
  SUBCATEGORY_NOT_FOUND: "Subcategory not found",
  SUBCATEGORY_RETRIEVED: "Subcategory retrieved successfully",
  SUBCATEGORIES_RETRIEVED: "Subcategories retrieved successfully",
  SUBCATEGORIES_NOT_FOUND: "No subcategories found",
  SUBCATEGORIES_RETRIEVAL_FAILED: "Failed to retrieve subcategories",
  SUBCATEGORY_UPDATED: "Subcategory updated successfully",
  SUBCATEGORY_UPDATE_FAILED: "Failed to update subcategory",
  SUBCATEGORY_DELETED: "Subcategory deleted successfully",
  SUBCATEGORY_DELETE_FAILED: "Failed to delete subcategory",
  
  // ===== Festival Management =====
  FESTIVAL_CREATED: "Festival created successfully",
  FESTIVAL_NOT_FOUND: "Festival not found",
  FESTIVAL_RETRIEVED: "Festival retrieved successfully",
  FESTIVALS_RETRIEVED: "Festivals retrieved successfully",
  FESTIVALS_NOT_FOUND: "No festivals found",
  FESTIVALS_RETRIEVAL_FAILED: "Failed to retrieve festivals",
  FESTIVAL_UPDATED: "Festival updated successfully",
  FESTIVAL_UPDATE_FAILED: "Failed to update festival",
  FESTIVAL_DELETED: "Festival deleted successfully",
  FESTIVAL_DELETE_FAILED: "Failed to delete festival",
  
  // ===== Product Management =====
  PRODUCT_CREATED: "Product created successfully",
  PRODUCT_NOT_FOUND: "Product not found",
  PRODUCT_RETRIEVED: "Product retrieved successfully",
  PRODUCT_RETRIEVAL_FAILED: "Failed to retrieve product",
  PRODUCTS_RETRIEVED: "Products retrieved successfully",
  PRODUCTS_RETRIEVAL_FAILED: "Failed to retrieve products",
  PRODUCTS_NOT_FOUND: "No products found",
  PRODUCT_UPDATED: "Product updated successfully",
  PRODUCT_DELETED: "Product deleted successfully",
  PRODUCT_RETRIEVED_BY_SLUG: (slug) => `Product with slug "${slug}" retrieved successfully`,
  PRODUCT_NOT_FOUND_BY_SLUG: (slug) => `No product found with slug "${slug}"`,
  SLUG_REQUIRED: "Product slug is required",
  
  // ===== Wishlist Management =====
  ADDED_PRODUCT_WISHLIST: "Product added to wishlist",
  REMOVED_PRODUCT_WISHLIST: "Product removed from wishlist",
  WISHLIST_RETRIEVED: "Wishlist retrieved successfully",
  WISHLIST_EMPTY: "Your wishlist is empty",
  WISHLIST_ITEM_EXISTS: "This product is already in your wishlist",
  WISHLIST_UPDATED: "Wishlist updated successfully",
  
  // ===== Cart Management =====
  ADDED_PRODUCT_CART: "Product added to cart",
  UPDATED_PRODUCT_CART: "Cart updated successfully",
  REMOVED_PRODUCT_CART: "Product removed from cart",
  CART_RETRIEVED: "Cart retrieved successfully",
  CART_EMPTY: "Your cart is empty",
  CART_ITEM_EXISTS: "This product is already in your cart",
  
  // ===== Order Management =====
  ORDER_CREATED: "Order placed successfully",
  ORDER_UPDATED: "Order updated successfully",
  ORDER_CANCELED: "Order canceled successfully",
  ORDER_NOT_FOUND: "Order not found",
  ORDER_RETRIEVED: "Order retrieved successfully",
  ORDERS_RETRIEVED: "Orders retrieved successfully",
  ORDER_STATUS_UPDATED: "Order status updated successfully",
  
  // ===== Promo Code Management =====
  PROMO_CODE_CREATED: "Promo code created successfully",
  PROMO_CODES_NOT_FOUND: "No promo codes found",
  PROMO_CODES_RETRIEVED: "Promo codes retrieved successfully",
  PROMO_CODE_NOT_FOUND: "Promo code not found",
  PROMO_CODE_RETRIEVED: "Promo code retrieved successfully",
  PROMO_CODE_UPDATED: "Promo code updated successfully",
  PROMO_CODE_DELETED: "Promo code deleted successfully",
  PROMO_CODE_REQUIRED: "Promo code is required",
  PROMO_CODE_INVALID: "Invalid promo code",
  PROMO_CODE_EXPIRED: "This promo code has expired",
  PROMO_CODE_VALID: "Promo code is valid",
  PROMO_CODE_MAX_USAGE: "This promo code has reached its usage limit",
  PROMO_CODE_ALREADY_USED: "You have already used this promo code",
  PROMO_CODE_NOT_ELIGIBLE: "You are not eligible to use this promo code",
  PROMO_CODE_MIN_ORDER: "Minimum order value not met for this promo code",
  PROMO_CODE_CHECK_FAILED: "Failed to check promo code",
  
  // ===== File Upload =====
  NO_FILES_UPLOADED: "No files provided for upload",
  FILES_UPLOADED: "Files uploaded successfully",
  FILE_UPLOAD_FAILED: "Failed to upload files",
  
  // ===== Review Management =====
  REVIEW_CREATED: "Review added successfully",
  REVIEWS_NOT_FOUND: "No reviews found for this product",
  REVIEWS_RETRIEVED: "Reviews retrieved successfully",
  REVIEW_UPDATED: "Review updated successfully",
  REVIEW_NOT_FOUND: "Review not found or unauthorized",
  REVIEW_DELETED: "Review deleted successfully",
  
  // ===== Transaction Management =====
  TRANSACTION_CREATED: "Transaction created successfully",
  TRANSACTION_NOT_FOUND: "Transaction not found",
  TRANSACTION_RETRIEVED: "Transaction retrieved successfully",
  TRANSACTION_UPDATED: "Transaction status updated successfully",
  TRANSACTIONS_NOT_FOUND: "No transactions found for this user",
  TRANSACTIONS_RETRIEVED: "User transactions retrieved successfully",
  
  // ===== Blog Management =====
  BLOG_CREATED: "Blog created successfully",
  BLOG_NOT_FOUND: "Blog not found",
  BLOG_RETRIEVED: "Blog retrieved successfully",
  BLOG_UPDATED: "Blog updated successfully",
  BLOG_DELETED: "Blog deleted successfully",
  BLOGS_NOT_FOUND: "No blogs found",
  BLOGS_RETRIEVED: "Blogs retrieved successfully",
  
  // ===== Contact Management =====
  CONTACT_SUBMITTED: "Contact form submitted successfully",
  CONTACT_NOT_FOUND: "Contact submission not found",
  CONTACT_RETRIEVED: "Contact submission retrieved successfully",
  CONTACT_STATUS_UPDATED: "Contact status updated successfully",
  CONTACT_DELETED: "Contact submission deleted successfully",
  CONTACTS_NOT_FOUND: "No contact submissions found",
  CONTACTS_RETRIEVED: "Contacts retrieved successfully",
  
  // ===== Cache Management =====
  CACHE_CLEARED: "Cache cleared successfully",
  CACHE_UPDATED: "Cache updated successfully",
  CACHE_ERROR: "Error accessing cache",
};

module.exports = messages;
