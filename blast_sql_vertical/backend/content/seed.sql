CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  country VARCHAR(50)
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100),
  price DECIMAL(10, 2),
  category VARCHAR(50)
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  order_date DATE,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO customers (id, name, email, country) VALUES
(1, 'Alice Johnson', 'alice@example.com', 'USA'),
(2, 'Bob Smith', 'bob@example.com', 'UK'),
(3, 'Carol White', 'carol@example.com', 'Canada'),
(4, 'David Brown', 'david@example.com', 'USA'),
(5, 'Eve Davis', 'eve@example.com', 'Australia'),
(6, 'Frank Wilson', 'frank@example.com', 'Germany'),
(7, 'Grace Lee', 'grace@example.com', 'USA');

INSERT INTO products (id, name, price, category) VALUES
(1, 'Laptop', 999.99, 'Electronics'),
(2, 'Mouse', 29.99, 'Electronics'),
(3, 'Keyboard', 79.99, 'Electronics'),
(4, 'Monitor', 299.99, 'Electronics'),
(5, 'Desk Chair', 199.99, 'Furniture'),
(6, 'Standing Desk', 449.99, 'Furniture'),
(7, 'USB Cable', 12.99, 'Accessories'),
(8, 'Webcam', 89.99, 'Electronics');

INSERT INTO orders (id, customer_id, product_id, quantity, order_date) VALUES
(1, 1, 1, 1, '2024-01-15'),
(2, 1, 2, 2, '2024-01-15'),
(3, 2, 3, 1, '2024-01-16'),
(4, 3, 1, 1, '2024-01-17'),
(5, 4, 5, 2, '2024-01-18'),
(6, 2, 4, 1, '2024-01-19'),
(7, 5, 6, 1, '2024-01-20'),
(8, 1, 7, 3, '2024-01-21'),
(9, 3, 8, 1, '2024-01-22'),
(10, 6, 2, 5, '2024-01-23'),
(11, 7, 1, 1, '2024-01-24'),
(12, 4, 3, 2, '2024-01-25'),
(13, 5, 4, 1, '2024-01-26'),
(14, 2, 5, 1, '2024-01-27'),
(15, 6, 8, 2, '2024-01-28');
