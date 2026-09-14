-- ================================================================
--  Crafty Closet v2 — MySQL Schema
--  Run: mysql -u root -p < database/schema.sql
-- ================================================================

CREATE DATABASE IF NOT EXISTS crafty_closet_v2
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE crafty_closet_v2;

-- ── Users ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(120)  NOT NULL,
  email             VARCHAR(180)  NOT NULL UNIQUE,
  password          VARCHAR(255)  DEFAULT NULL,          -- NULL for OAuth users
  role              ENUM('user','admin') NOT NULL DEFAULT 'user',
  is_active         TINYINT(1)    NOT NULL DEFAULT 1,
  google_id         VARCHAR(100)  DEFAULT NULL UNIQUE,   -- Google OAuth ID
  avatar            VARCHAR(500)  DEFAULT NULL,          -- Google profile picture
  email_verified    TINYINT(1)    NOT NULL DEFAULT 0,
  verification_token VARCHAR(100) DEFAULT NULL,
  reset_token       VARCHAR(100)  DEFAULT NULL,
  reset_token_expiry DATETIME     DEFAULT NULL,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email     (email),
  INDEX idx_google_id (google_id)
);

-- ── Products ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(250)  NOT NULL,
  slug          VARCHAR(280)  NOT NULL UNIQUE,
  description   TEXT,
  price         DECIMAL(10,2) NOT NULL,
  compare_price DECIMAL(10,2) DEFAULT NULL,
  category      ENUM('earrings','necklaces','rings','bracelets','anklets','hairclips','bangles','sets') NOT NULL,
  image         VARCHAR(500)  NOT NULL DEFAULT '/uploads/placeholder.jpg',
  stock         INT           NOT NULL DEFAULT 0,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  rating        DECIMAL(3,2)  NOT NULL DEFAULT 0.00,
  rating_count  INT           NOT NULL DEFAULT 0,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category  (category),
  INDEX idx_is_active (is_active)
);

-- ── Cart ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity   INT          NOT NULL DEFAULT 1,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cart (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ── Wishlist ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  added_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wishlist (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ── Orders ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  order_number     VARCHAR(40)   NOT NULL UNIQUE,
  user_id          INT UNSIGNED  NOT NULL,
  total_price      DECIMAL(10,2) NOT NULL,
  status           ENUM('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  payment_method   VARCHAR(50)   NOT NULL DEFAULT 'cod',
  shipping_name    VARCHAR(150),
  shipping_email   VARCHAR(180),
  shipping_phone   VARCHAR(25),
  shipping_address TEXT,
  notes            TEXT,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status  (status)
);

-- ── Order Items ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id         INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  order_id   INT UNSIGNED  NOT NULL,
  product_id INT UNSIGNED  DEFAULT NULL,
  name       VARCHAR(250)  NOT NULL,
  price      DECIMAL(10,2) NOT NULL,
  quantity   INT           NOT NULL,
  image      VARCHAR(500)  DEFAULT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- ── Ratings ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  stars      TINYINT      NOT NULL CHECK (stars BETWEEN 1 AND 5),
  review     TEXT,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_rating (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ================================================================
--  Sample Products
-- ================================================================
INSERT IGNORE INTO products (name, slug, description, price, compare_price, category, stock, rating, rating_count) VALUES
('Rose Gold Floral Studs',      'rose-gold-floral-studs',      'Delicate rose-gold plated floral stud earrings. Perfect for everyday wear.',    299.00,  399.00, 'earrings',  50, 4.5, 28),
('Pearl Drop Danglers',         'pearl-drop-danglers',         'Elegant faux-pearl drop earrings that add effortless sophistication.',           449.00,  599.00, 'earrings',  35, 4.7, 42),
('Gold Layered Necklace Set',   'gold-layered-necklace-set',   '18k gold-plated 3-piece layered chain necklace set.',                            599.00,  799.00, 'necklaces', 20, 4.8, 61),
('Butterfly Pendant Necklace',  'butterfly-pendant-necklace',  'Dainty silver-tone butterfly pendant on a delicate 16-inch box chain.',          349.00,  499.00, 'necklaces', 45, 4.6, 33),
('Crystal Stackable Rings Set', 'crystal-stackable-rings-set', 'Set of 5 midi rings with crystal accents in mixed metals.',                     399.00,  549.00, 'rings',     60, 4.4, 19),
('Adjustable Floral Ring',      'adjustable-floral-ring',      'Open-band adjustable ring with a 3D floral centrepiece. Rose-gold tone.',        199.00,  299.00, 'rings',     80, 4.3, 14),
('Beaded Friendship Bracelet',  'beaded-friendship-bracelet',  'Handcrafted pastel-bead friendship bracelet. Adjustable length.',                249.00,  349.00, 'bracelets', 70, 4.5, 37),
('Gold Charm Bracelet',         'gold-charm-bracelet',         'Dainty gold bracelet with 7 assorted charms — hearts, stars, moons.',           499.00,  649.00, 'bracelets', 25, 4.9, 55),
('Silver Boho Anklet',          'silver-boho-anklet',          'Bohemian silver anklet with tiny tinkling bells. Adjustable length.',            279.00,  399.00, 'anklets',   40, 4.4, 22),
('Pastel Floral Hair Clip Set', 'pastel-floral-hair-clip-set', 'Pack of 6 resin floral hair clips in soft pastel shades.',                      199.00,  299.00, 'hairclips', 100,4.6, 48),
('Enamel Statement Bangle Set', 'enamel-statement-bangle-set', 'Set of 4 colour-block enamel bangles. Stackable and lightweight.',               549.00,  749.00, 'bangles',   30, 4.7, 29),
('Bridal Jewellery Gift Set',   'bridal-jewellery-gift-set',   'Complete bridal set: necklace, earrings, maang tikka and bangles. Gift-boxed.', 1299.00, 1799.00,'sets',      15, 4.9, 73);
