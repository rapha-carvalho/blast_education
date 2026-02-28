-- Legacy/default schema: keep for backward compatibility with existing lessons
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

-- ========== sales (Module 1 foundations) ==========
CREATE TABLE sales (
  id INTEGER PRIMARY KEY,
  customer VARCHAR(100),
  amount DECIMAL(10, 2),
  date DATE
);
INSERT INTO sales (id, customer, amount, date) VALUES
(1, 'Ana', 150.00, '2024-01-10'),
(2, 'John', 89.50, '2024-01-11'),
(3, 'Ana', 200.00, '2024-01-12'),
(4, 'Maria', 75.25, '2024-01-13'),
(5, 'John', 320.00, '2024-01-14'),
(6, 'Ana', 45.99, '2024-01-15'),
(7, 'Carlos', 189.00, '2024-01-16'),
(8, 'Maria', 112.50, '2024-01-17');

-- ========== filtering (Module 2: WHERE, conditions, operators) ==========
CREATE SCHEMA IF NOT EXISTS filtering;

CREATE TABLE filtering.customers (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  country VARCHAR(50),
  phone VARCHAR(50)
);

CREATE TABLE filtering.products (
  id INTEGER PRIMARY KEY,
  product_name VARCHAR(100),
  price DECIMAL(10, 2),
  category VARCHAR(50)
);

CREATE TABLE filtering.orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  amount DECIMAL(10, 2),
  city VARCHAR(50),
  country VARCHAR(50),
  status VARCHAR(20),
  order_date DATE,
  delivery_date DATE
);

INSERT INTO filtering.customers (id, name, email, country, phone) VALUES
(1, 'John Smith', 'john@gmail.com', 'USA', '555-0101'),
(2, 'Jane Doe', 'jane@yahoo.com', 'USA', NULL),
(3, 'Bob Wilson', NULL, 'Canada', '555-0102'),
(4, 'Alice Brown', 'alice@gmail.com', 'Mexico', NULL),
(5, 'Carlos Garcia', 'carlos@gmail.com', 'Brazil', '555-0103'),
(6, 'Julia Martinez', 'julia@outlook.com', 'Argentina', '555-0104'),
(7, 'James Lee', 'james@gmail.com', 'USA', '555-0105'),
(8, 'Mary Johnson', 'mary@company.com', 'Canada', NULL),
(9, 'Jose Hernandez', NULL, 'Mexico', '555-0106'),
(10, 'Professional Tools Co', 'info@protools.com', 'USA', '555-0107');

INSERT INTO filtering.products (id, product_name, price, category) VALUES
(1, 'Laptop Pro', 1299.99, 'Electronics'),
(2, 'Professional Mouse', 79.99, 'Electronics'),
(3, 'Keyboard', 49.99, 'Electronics'),
(4, 'Monitor', 299.99, 'Electronics'),
(5, 'Software Pro', 199.99, 'Software'),
(6, 'Projector', 449.99, 'Electronics'),
(7, 'USB Cable', 12.99, 'Accessories');

INSERT INTO filtering.orders (id, customer_id, amount, city, country, status, order_date, delivery_date) VALUES
(1, 1, 650.00, 'NYC', 'USA', 'approved', '2024-03-15', '2024-03-18'),
(2, 2, 45.00, 'LA', 'USA', 'pending', '2024-03-10', NULL),
(3, 3, 350.00, 'Toronto', 'Canada', 'approved', '2023-06-20', '2023-06-25'),
(4, 4, 120.00, 'Mexico City', 'Mexico', 'approved', '2023-11-05', '2023-11-08'),
(5, 5, 550.00, 'Sao Paulo', 'Brazil', 'approved', '2024-02-01', '2024-02-05'),
(6, 6, 25.00, 'Buenos Aires', 'Argentina', 'rejected', '2024-01-12', NULL),
(7, 7, 320.00, 'Chicago', 'USA', 'approved', '2023-08-22', '2023-08-25'),
(8, 8, 90.00, 'Vancouver', 'Canada', 'pending', '2023-12-10', NULL),
(9, 9, 410.00, 'Guadalajara', 'Mexico', 'approved', '2023-04-15', '2023-04-20'),
(10, 1, 280.00, 'NYC', 'USA', 'approved', '2023-09-01', '2023-09-04'),
(11, 5, 180.00, 'Rio', 'Brazil', 'approved', '2023-07-30', '2023-08-02'),
(12, 6, 380.00, 'Cordoba', 'Argentina', 'approved', '2024-01-20', '2024-01-24'),
(13, 2, 75.00, 'LA', 'USA', 'approved', '2023-03-05', '2023-03-08'),
(14, 4, 35.00, 'Tijuana', 'Mexico', 'pending', '2024-02-14', NULL),
(15, 3, 250.00, 'Montreal', 'Canada', 'approved', '2023-10-12', '2023-10-15'),
(16, 7, 420.00, 'Boston', 'USA', 'approved', '2023-05-18', '2023-05-22'),
(17, 8, 110.00, 'Calgary', 'Canada', 'approved', '2023-11-28', '2023-12-01'),
(18, 5, 95.00, 'Brasilia', 'Brazil', 'approved', '2024-02-20', '2024-02-23'),
(19, 6, 310.00, 'Mendoza', 'Argentina', 'approved', '2023-08-10', '2023-08-14'),
(20, 1, 480.00, 'NYC', 'USA', 'approved', '2023-12-25', '2023-12-28'),
(21, 2, 22.00, 'LA', 'USA', 'rejected', '2024-03-01', NULL),
(22, 3, 160.00, 'Toronto', 'Canada', 'approved', '2023-02-14', '2023-02-17');

-- ========== food_delivery ==========
CREATE SCHEMA IF NOT EXISTS food_delivery;

CREATE TABLE food_delivery.restaurants (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100),
  cuisine VARCHAR(50),
  city VARCHAR(50)
);

CREATE TABLE food_delivery.customers (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  city VARCHAR(50)
);

CREATE TABLE food_delivery.drivers (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100),
  vehicle VARCHAR(50),
  city VARCHAR(50)
);

CREATE TABLE food_delivery.orders (
  id INTEGER PRIMARY KEY,
  restaurant_id INTEGER,
  customer_id INTEGER,
  driver_id INTEGER,
  order_date DATE,
  total_amount DECIMAL(10, 2),
  status VARCHAR(20)
);

CREATE TABLE food_delivery.order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER,
  item_name VARCHAR(100),
  quantity INTEGER,
  unit_price DECIMAL(10, 2)
);

INSERT INTO food_delivery.restaurants (id, name, cuisine, city) VALUES
(1, 'Pizza Hub', 'Italian', 'NYC'),
(2, 'Bowl & Roll', 'Asian', 'NYC'),
(3, 'Taco Lane', 'Mexican', 'LA');

INSERT INTO food_delivery.customers (id, name, email, city) VALUES
(1, 'Jane Doe', 'jane@example.com', 'NYC'),
(2, 'John Smith', 'john@example.com', 'LA'),
(3, 'Maria Garcia', 'maria@example.com', 'NYC');

INSERT INTO food_delivery.drivers (id, name, vehicle, city) VALUES
(1, 'Mike Driver', 'Bike', 'NYC'),
(2, 'Sarah Rider', 'Car', 'LA');

INSERT INTO food_delivery.orders (id, restaurant_id, customer_id, driver_id, order_date, total_amount, status) VALUES
(1, 1, 1, 1, '2024-02-01', 24.99, 'delivered'),
(2, 1, 2, 2, '2024-02-02', 32.00, 'delivered'),
(3, 2, 1, 1, '2024-02-03', 18.50, 'delivered'),
(4, 3, 3, 1, '2024-02-04', 15.00, 'pending');

INSERT INTO food_delivery.order_items (id, order_id, item_name, quantity, unit_price) VALUES
(1, 1, 'Margherita Pizza', 1, 14.99),
(2, 1, 'Garlic Bread', 1, 10.00),
(3, 2, 'Pepperoni Pizza', 2, 16.00),
(4, 3, 'Rice Bowl', 1, 18.50),
(5, 4, 'Tacos', 3, 5.00);

-- ========== ecommerce (spec: users, orders, products, order_items, payments) ==========
CREATE SCHEMA IF NOT EXISTS ecommerce;

CREATE TABLE ecommerce.users (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  country VARCHAR(50)
);

CREATE TABLE ecommerce.products (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100),
  price DECIMAL(10, 2),
  category VARCHAR(50)
);

CREATE TABLE ecommerce.orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  order_date DATE,
  status VARCHAR(20)
);

CREATE TABLE ecommerce.order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  unit_price DECIMAL(10, 2)
);

CREATE TABLE ecommerce.payments (
  id INTEGER PRIMARY KEY,
  order_id INTEGER,
  amount DECIMAL(10, 2),
  method VARCHAR(20),
  paid_at DATE
);

INSERT INTO ecommerce.users (id, name, email, country)
SELECT i, 'User ' || i, 'user' || i || '@example.com', CASE i % 5 WHEN 0 THEN 'USA' WHEN 1 THEN 'UK' WHEN 2 THEN 'Brazil' WHEN 3 THEN 'Canada' ELSE 'Germany' END
FROM range(1, 501) t(i);

INSERT INTO ecommerce.products (id, name, price, category)
SELECT i, 'Product ' || i, ROUND((i * 13.5) % 150 + 10, 2), CASE i % 4 WHEN 0 THEN 'Electronics' WHEN 1 THEN 'Office' WHEN 2 THEN 'Home' ELSE 'Apparel' END
FROM range(1, 51) t(i);

INSERT INTO ecommerce.orders (id, user_id, order_date, status)
SELECT i, 1 + (i % 500), DATE '2024-01-01' + CAST((i % 100) AS INTEGER), CASE i % 5 WHEN 0 THEN 'pending' WHEN 1 THEN 'shipped' WHEN 2 THEN 'cancelled' ELSE 'delivered' END
FROM range(1, 1501) t(i);

INSERT INTO ecommerce.order_items (id, order_id, product_id, quantity, unit_price)
SELECT i, 1 + (i % 1500), 1 + (i % 50), 1 + ((i * 7) % 5), ROUND(((i * 13.5) % 150 + 10), 2)
FROM range(1, 3001) t(i);

INSERT INTO ecommerce.payments (id, order_id, amount, method, paid_at)
SELECT i, i, ROUND((i * 21.3) % 300 + 20, 2), CASE i % 3 WHEN 0 THEN 'card' WHEN 1 THEN 'paypal' ELSE 'bank_transfer' END, DATE '2024-01-01' + CAST(((i % 100) + 2) AS INTEGER)
FROM range(1, 1501) t(i);

-- ========== saas_subscription ==========
CREATE SCHEMA IF NOT EXISTS saas_subscription;

CREATE TABLE saas_subscription.accounts (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100),
  created_at DATE
);

CREATE TABLE saas_subscription.plans (
  id INTEGER PRIMARY KEY,
  name VARCHAR(50),
  monthly_price DECIMAL(10, 2)
);

CREATE TABLE saas_subscription.subscriptions (
  id INTEGER PRIMARY KEY,
  account_id INTEGER,
  plan_id INTEGER,
  started_at DATE,
  status VARCHAR(20)
);

CREATE TABLE saas_subscription.invoices (
  id INTEGER PRIMARY KEY,
  subscription_id INTEGER,
  amount DECIMAL(10, 2),
  due_date DATE,
  paid_at DATE
);

CREATE TABLE saas_subscription.events (
  id INTEGER PRIMARY KEY,
  account_id INTEGER,
  event_type VARCHAR(50),
  occurred_at DATE
);

INSERT INTO saas_subscription.plans (id, name, monthly_price) VALUES
(1, 'Starter', 29.00),
(2, 'Pro', 99.00),
(3, 'Enterprise', 299.00);

INSERT INTO saas_subscription.accounts (id, name, created_at)
SELECT i, 'Company ' || i, DATE '2023-01-01' + CAST((i % 365) AS INTEGER)
FROM range(1, 601) t(i);

INSERT INTO saas_subscription.subscriptions (id, account_id, plan_id, started_at, status)
SELECT i, i, 1 + (i % 3), DATE '2023-01-01' + CAST(((i % 365) + 10) AS INTEGER), CASE i % 6 WHEN 0 THEN 'cancelled' WHEN 1 THEN 'past_due' ELSE 'active' END
FROM range(1, 601) t(i);

INSERT INTO saas_subscription.invoices (id, subscription_id, amount, due_date, paid_at)
SELECT i, 1 + (i % 600), CASE (i % 3) WHEN 0 THEN 29.00 WHEN 1 THEN 99.00 ELSE 299.00 END, DATE '2023-01-01' + CAST(((i % 365) + 40) AS INTEGER), CASE i % 10 WHEN 0 THEN NULL ELSE DATE '2023-01-01' + CAST(((i % 365) + 38) AS INTEGER) END
FROM range(1, 3001) t(i);

INSERT INTO saas_subscription.events (id, account_id, event_type, occurred_at)
SELECT i, 1 + (i % 600), CASE i % 8 WHEN 0 THEN 'churn' WHEN 1 THEN 'upgrade' WHEN 2 THEN 'downgrade' ELSE 'login' END, DATE '2023-01-01' + CAST((i % 365) AS INTEGER)
FROM range(1, 5001) t(i);

-- ========== mobility ==========
CREATE SCHEMA IF NOT EXISTS mobility;

CREATE TABLE mobility.cities (
  id INTEGER PRIMARY KEY,
  name VARCHAR(50),
  region VARCHAR(50)
);

CREATE TABLE mobility.drivers (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100),
  city_id INTEGER
);

CREATE TABLE mobility.rides (
  id INTEGER PRIMARY KEY,
  driver_id INTEGER,
  city_id INTEGER,
  ride_date DATE,
  duration_minutes INTEGER,
  fare DECIMAL(10, 2)
);

CREATE TABLE mobility.payments (
  id INTEGER PRIMARY KEY,
  ride_id INTEGER,
  amount DECIMAL(10, 2),
  status VARCHAR(20)
);

INSERT INTO mobility.cities (id, name, region) VALUES
(1, 'NYC', 'Northeast'),
(2, 'LA', 'West'),
(3, 'Chicago', 'Midwest'),
(4, 'Houston', 'South'),
(5, 'Miami', 'South');

INSERT INTO mobility.drivers (id, name, city_id)
SELECT i, 'Driver ' || i, 1 + (i % 5)
FROM range(1, 501) t(i);

INSERT INTO mobility.rides (id, driver_id, city_id, ride_date, duration_minutes, fare)
SELECT i, 1 + (i % 500), 1 + (i % 5), DATE '2024-01-01' + CAST((i % 90) AS INTEGER), 5 + ((i * 17) % 50), ROUND(10 + ((i * 23.5) % 80), 2)
FROM range(1, 4001) t(i);

INSERT INTO mobility.payments (id, ride_id, amount, status)
SELECT i, i, ROUND(10 + ((i * 23.5) % 80), 2), CASE i % 15 WHEN 0 THEN 'failed' WHEN 1 THEN 'pending' ELSE 'completed' END
FROM range(1, 4001) t(i);

CREATE TABLE clientes (
  customer_id INTEGER PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(50),
  created_at DATE,
  acquisition_channel VARCHAR(50),
  country VARCHAR(50)
);

INSERT INTO clientes (customer_id, first_name, last_name, email, phone, created_at, acquisition_channel, country) VALUES
(1, 'Ana', 'Silva', 'ana.silva@email.com', '11-99001-1111', '2023-01-15', 'organic', 'Brasil'),
(2, 'Carlos', 'Souza', 'carlos.souza@email.com', '21-98002-2222', '2023-02-03', 'paid_ads', 'Brasil'),
(3, 'Maria', 'Oliveira', 'maria.o@email.com', NULL, '2023-02-20', 'referral', 'Brasil'),
(4, 'Lucas', 'Pereira', 'lucas.p@email.com', '31-97003-3333', '2023-03-10', 'organic', 'Brasil'),
(5, 'Fernanda', 'Costa', 'fernanda.c@email.com', '41-96004-4444', '2023-04-05', 'social_media', 'Brasil'),
(6, 'Rafael', 'Mendes', 'rafael.m@email.com', NULL, '2023-04-22', 'email', 'Brasil'),
(7, 'Juliana', 'Ferreira', 'juliana.f@email.com', '51-95005-5555', '2023-05-15', 'paid_ads', 'Brasil'),
(8, 'Bruno', 'Rodrigues', 'bruno.r@email.com', '61-94006-6666', '2023-06-01', 'organic', 'Brasil'),
(9, 'Patricia', 'Lima', 'patricia.l@email.com', '71-93007-7777', '2023-07-12', 'referral', 'Brasil'),
(10, 'Gustavo', 'Alves', 'gustavo.a@email.com', NULL, '2023-08-25', 'organic', 'Brasil');

CREATE TABLE pedidos (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  created_at DATE,
  status_code VARCHAR(20),
  order_total DECIMAL(10, 2)
);

INSERT INTO pedidos (order_id, customer_id, created_at, status_code, order_total) VALUES
(1001, 1, '2024-01-05', 'entregue', 299.90),
(1002, 2, '2024-01-07', 'entregue', 89.50),
(1003, 1, '2024-01-12', 'cancelado', 150.00),
(1004, 3, '2024-01-15', 'entregue', 450.00),
(1005, 4, '2024-01-20', 'entregue', 199.90),
(1006, 5, '2024-02-01', 'entregue', 79.90),
(1007, 2, '2024-02-05', 'pendente', 320.00),
(1008, 6, '2024-02-10', 'entregue', 560.00),
(1009, 7, '2024-02-14', 'entregue', 125.50),
(1010, 1, '2024-02-20', 'entregue', 88.00),
(1011, 8, '2024-03-01', 'entregue', 475.00),
(1012, 3, '2024-03-05', 'cancelado', 110.00),
(1013, 9, '2024-03-08', 'entregue', 235.80),
(1014, 10, '2024-03-12', 'pendente', 399.00),
(1015, 4, '2024-03-18', 'entregue', 99.90);

-- ========== produtos (GrooveCommerce product catalog) ==========
CREATE TABLE produtos (
  product_id INTEGER PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  category   VARCHAR(50),
  price      DECIMAL(10, 2),
  in_stock   BOOLEAN
);

INSERT INTO produtos (product_id, name, category, price, in_stock) VALUES
(1, 'Camiseta Básica',       'Vestuário',    49.90,  TRUE),
(2, 'Calça Jeans',           'Vestuário',   159.90,  TRUE),
(3, 'Tênis Running',         'Calçados',    299.90,  TRUE),
(4, 'Mochila Executiva',     'Acessórios',  189.90,  FALSE),
(5, 'Relógio Digital',       'Acessórios',  349.90,  TRUE),
(6, 'Livro SQL Avançado',    'Livros',       79.90,  TRUE),
(7, 'Fone de Ouvido BT',     'Eletrônicos', 199.90,  TRUE),
(8, 'Carregador Portátil',   'Eletrônicos', 129.90,  FALSE);

-- ========== itens_pedido (GrooveCommerce order line items â€” FK to pedidos + produtos) ==========
CREATE TABLE itens_pedido (
  item_id    INTEGER PRIMARY KEY,
  order_id   INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity   INTEGER,
  unit_price DECIMAL(10, 2)
);

INSERT INTO itens_pedido (item_id, order_id, product_id, quantity, unit_price) VALUES
(1,  1001, 3, 1, 299.90),
(2,  1002, 6, 1,  79.90),
(3,  1003, 1, 2,  49.90),
(4,  1003, 4, 1, 189.90),
(5,  1004, 3, 1, 299.90),
(6,  1004, 7, 1, 199.90),
(7,  1005, 2, 1, 159.90),
(8,  1006, 1, 1,  49.90),
(9,  1007, 5, 1, 349.90),
(10, 1008, 7, 2, 199.90),
(11, 1008, 8, 1, 129.90),
(12, 1009, 1, 1,  49.90),
(13, 1009, 6, 1,  79.90),
(14, 1010, 8, 1,  89.90),
(15, 1011, 3, 1, 299.90),
(16, 1011, 5, 1, 349.90),
(17, 1012, 2, 1, 159.90),
(18, 1013, 7, 1, 199.90),
(19, 1014, 5, 1, 349.90),
(20, 1015, 1, 2,  49.90);

-- ========== capstone dataset (master challenge) ==========
CREATE SCHEMA IF NOT EXISTS capstone;

CREATE TABLE capstone.clientes (
  cliente_id INTEGER PRIMARY KEY,
  data_cadastro DATE,
  canal_aquisicao VARCHAR(30),
  cidade VARCHAR(40),
  estado VARCHAR(2),
  segmento_renda VARCHAR(20),
  email VARCHAR(120)
);

CREATE TABLE capstone.produtos (
  produto_id INTEGER PRIMARY KEY,
  nome_produto VARCHAR(80),
  categoria VARCHAR(30),
  subcategoria VARCHAR(30),
  preco_lista DECIMAL(12, 2),
  custo_unitario DECIMAL(12, 2),
  ativo BOOLEAN
);

CREATE TABLE capstone.pedidos (
  pedido_id INTEGER PRIMARY KEY,
  cliente_id INTEGER,
  data_pedido DATE,
  status_pedido VARCHAR(20),
  valor_bruto DECIMAL(12, 2),
  desconto_aplicado DECIMAL(12, 2),
  valor_frete DECIMAL(12, 2),
  cupom_codigo VARCHAR(30),
  canal_pedido VARCHAR(20),
  data_entrega DATE
);

CREATE TABLE capstone.itens_pedido (
  item_id INTEGER PRIMARY KEY,
  pedido_id INTEGER,
  produto_id INTEGER,
  quantidade INTEGER,
  preco_unitario DECIMAL(12, 2),
  custo_unitario DECIMAL(12, 2)
);

CREATE TABLE capstone.pagamentos (
  pagamento_id INTEGER PRIMARY KEY,
  pedido_id INTEGER,
  metodo_pagamento VARCHAR(20),
  status_pagamento VARCHAR(20),
  valor_pago DECIMAL(12, 2),
  data_pagamento DATE,
  parcelas INTEGER
);

CREATE TABLE capstone.eventos_funil (
  evento_id INTEGER PRIMARY KEY,
  cliente_id INTEGER,
  sessao_id VARCHAR(30),
  etapa_funil VARCHAR(20),
  data_evento DATE,
  canal_midia VARCHAR(20),
  campanha_id INTEGER
);

CREATE TABLE capstone.reembolsos (
  reembolso_id INTEGER PRIMARY KEY,
  pedido_id INTEGER,
  item_id INTEGER,
  valor_reembolso DECIMAL(12, 2),
  motivo_reembolso VARCHAR(30),
  data_reembolso DATE
);

-- clientes: weighted acquisition channels (organic 30%, paid_search 25%, paid_social 20%, referral 14%, email 11%)
-- estado: SP 38%, RJ 22%, MG 12%, PR 10%, RS 10%, BA 8%
-- segmento_renda: alta 15%, media_alta 25%, media 35%, entrada 25%
WITH base AS (
  SELECT
    i,
    ((i * 7 + i % 13) % 100) AS acq_bucket,
    ((i * 11 + i % 17) % 100) AS state_bucket,
    ((i * 3 + i % 7) % 100) AS income_bucket
  FROM (SELECT range::INTEGER AS i FROM range(1, 801))
)
INSERT INTO capstone.clientes
SELECT
  i AS cliente_id,
  DATE '2023-01-01' + CAST((i % 730) AS INTEGER) AS data_cadastro,
  CASE
    WHEN acq_bucket < 30 THEN 'organic'
    WHEN acq_bucket < 55 THEN 'paid_search'
    WHEN acq_bucket < 75 THEN 'paid_social'
    WHEN acq_bucket < 89 THEN 'referral'
    ELSE 'email'
  END AS canal_aquisicao,
  CASE
    WHEN state_bucket < 38 THEN 'sao_paulo'
    WHEN state_bucket < 60 THEN 'rio_janeiro'
    WHEN state_bucket < 72 THEN 'belo_horizonte'
    WHEN state_bucket < 82 THEN 'curitiba'
    WHEN state_bucket < 92 THEN 'porto_alegre'
    ELSE 'salvador'
  END AS cidade,
  CASE
    WHEN state_bucket < 38 THEN 'SP'
    WHEN state_bucket < 60 THEN 'RJ'
    WHEN state_bucket < 72 THEN 'MG'
    WHEN state_bucket < 82 THEN 'PR'
    WHEN state_bucket < 92 THEN 'RS'
    ELSE 'BA'
  END AS estado,
  CASE
    WHEN income_bucket < 15 THEN 'alta'
    WHEN income_bucket < 40 THEN 'media_alta'
    WHEN income_bucket < 75 THEN 'media'
    ELSE 'entrada'
  END AS segmento_renda,
  CASE
    WHEN i % 9 = 0 THEN NULL
    ELSE 'cliente_' || CAST(i AS VARCHAR) || '@blastmail.com'
  END AS email
FROM base;

-- produtos: category-specific margins
-- eletronicos: custo ~58-59% of preco (low margin ~41%)
-- beleza: custo ~32-37% of preco (high margin ~65%)
-- moda: ~47-51%, casa: ~51-54%, esporte: ~49-53%, acessorios: ~43-48%
WITH base AS (
  SELECT
    i AS produto_id,
    'produto_' || CAST(i AS VARCHAR) AS nome_produto,
    CASE i % 6
      WHEN 0 THEN 'eletronicos'
      WHEN 1 THEN 'casa'
      WHEN 2 THEN 'moda'
      WHEN 3 THEN 'esporte'
      WHEN 4 THEN 'beleza'
      ELSE 'acessorios'
    END AS categoria,
    CASE i % 8
      WHEN 0 THEN 'premium'
      WHEN 1 THEN 'standard'
      WHEN 2 THEN 'economico'
      WHEN 3 THEN 'lancamento'
      WHEN 4 THEN 'alto_giro'
      WHEN 5 THEN 'sazonal'
      WHEN 6 THEN 'kit'
      ELSE 'assinatura'
    END AS subcategoria,
    ROUND(15 + ((i * 17) % 140) * 3.10, 2) AS preco_lista,
    CASE WHEN i % 29 = 0 THEN FALSE ELSE TRUE END AS ativo
  FROM (SELECT range::INTEGER AS i FROM range(1, 241))
)
INSERT INTO capstone.produtos
SELECT
  produto_id,
  nome_produto,
  categoria,
  subcategoria,
  preco_lista,
  ROUND(preco_lista * CASE categoria
    WHEN 'eletronicos' THEN 0.58 + ((produto_id * 3) % 5) * 0.008
    WHEN 'casa'        THEN 0.51 + ((produto_id * 11) % 4) * 0.010
    WHEN 'moda'        THEN 0.47 + ((produto_id * 7) % 5) * 0.009
    WHEN 'esporte'     THEN 0.49 + ((produto_id * 13) % 6) * 0.008
    WHEN 'beleza'      THEN 0.32 + ((produto_id * 5) % 7) * 0.006
    ELSE                    0.43 + ((produto_id * 17) % 5) * 0.009
  END, 2) AS custo_unitario,
  ativo
FROM base;

-- pedidos: canal_pedido weighted web 45%, app 35%, inside_sales 20%
-- cancellation by canal: app ~19%, web ~8%, inside_sales ~4%
-- valor_bruto: Q3 (Jul-Sep) -15%, Q4 (Oct-Dec) +20%, app -12%, inside_sales +18%
-- paid_search/paid_social clients get -28% lower AOV (joined from clientes)
WITH raw AS (
  SELECT
    i AS pedido_id,
    CASE WHEN i % 173 = 0 THEN NULL ELSE 1 + (i % 800) END AS cliente_id,
    DATE '2024-01-01' + CAST((i % 730) AS INTEGER) AS data_pedido,
    ((i * 13 + i % 11) % 100) AS canal_bucket,
    ((i * 7 + i % 19) % 100) AS status_bucket,
    EXTRACT(MONTH FROM (DATE '2024-01-01' + CAST((i % 730) AS INTEGER)))::INTEGER AS mes,
    ROUND(40 + ((i * 37) % 900) + (i % 7) * 0.9, 2) AS valor_base
  FROM (SELECT range::INTEGER AS i FROM range(1, 8001))
),
with_canal AS (
  SELECT r.*,
    CASE
      WHEN r.canal_bucket < 45 THEN 'web'
      WHEN r.canal_bucket < 80 THEN 'app'
      ELSE 'inside_sales'
    END AS canal_pedido
  FROM raw r
),
with_status AS (
  SELECT wc.*,
    CASE wc.canal_pedido
      WHEN 'web' THEN
        CASE WHEN wc.status_bucket < 8  THEN 'cancelado'
             WHEN wc.status_bucket < 13 THEN 'pendente'
             ELSE 'entregue' END
      WHEN 'app' THEN
        CASE WHEN wc.status_bucket < 19 THEN 'cancelado'
             WHEN wc.status_bucket < 26 THEN 'pendente'
             ELSE 'entregue' END
      ELSE
        CASE WHEN wc.status_bucket < 4  THEN 'cancelado'
             WHEN wc.status_bucket < 7  THEN 'pendente'
             ELSE 'entregue' END
    END AS status_pedido
  FROM with_canal wc
),
with_cliente AS (
  SELECT ws.*,
    COALESCE(c.canal_aquisicao, 'organic') AS canal_aquisicao
  FROM with_status ws
  LEFT JOIN capstone.clientes c ON ws.cliente_id = c.cliente_id
)
INSERT INTO capstone.pedidos
SELECT
  pedido_id,
  cliente_id,
  data_pedido,
  status_pedido,
  ROUND(
    valor_base
    * CASE WHEN mes IN (7, 8, 9)    THEN 0.85
           WHEN mes IN (10, 11, 12) THEN 1.20
           ELSE 1.0 END
    * CASE canal_pedido
           WHEN 'app'          THEN 0.88
           WHEN 'inside_sales' THEN 1.18
           ELSE 1.0 END
    * CASE WHEN canal_aquisicao IN ('paid_search', 'paid_social') THEN 0.72 ELSE 1.0 END
  , 2) AS valor_bruto,
  CASE
    WHEN pedido_id % 6 = 0 THEN ROUND(((pedido_id * 11) % 120) * 0.5, 2)
    ELSE 0
  END AS desconto_aplicado,
  CASE
    WHEN pedido_id % 9 = 0 THEN NULL
    ELSE ROUND(7 + (pedido_id % 4) * 2.5, 2)
  END AS valor_frete,
  CASE
    WHEN pedido_id % 15 = 0 THEN 'cupom_10'
    WHEN pedido_id % 28 = 0 THEN 'cupom_20'
    ELSE NULL
  END AS cupom_codigo,
  canal_pedido,
  CASE
    WHEN status_pedido IN ('cancelado', 'pendente') THEN NULL
    ELSE data_pedido + (2 + (pedido_id % 8) + CASE WHEN pedido_id % 14 = 0 THEN 5 ELSE 0 END)
  END AS data_entrega
FROM with_cliente;

INSERT INTO capstone.itens_pedido
SELECT
  i AS item_id,
  1 + ((i * 17) % 8000) AS pedido_id,
  1 + ((i * 29) % 240) AS produto_id,
  1 + (i % 4) AS quantidade,
  ROUND(p.preco_lista * (0.82 + (i % 7) * 0.03), 2) AS preco_unitario,
  ROUND(p.custo_unitario * (0.90 + (i % 5) * 0.02), 2) AS custo_unitario
FROM (SELECT range::INTEGER AS i FROM range(1, 24001))
JOIN capstone.produtos p
  ON p.produto_id = 1 + ((i * 29) % 240);

INSERT INTO capstone.pagamentos
SELECT
  p.pedido_id AS pagamento_id,
  p.pedido_id,
  CASE p.pedido_id % 4
    WHEN 0 THEN 'cartao_credito'
    WHEN 1 THEN 'pix'
    WHEN 2 THEN 'boleto'
    ELSE 'carteira_digital'
  END AS metodo_pagamento,
  CASE
    WHEN p.status_pedido = 'cancelado' THEN 'estornado'
    WHEN p.status_pedido = 'pendente' THEN 'aguardando'
    WHEN p.pedido_id % 23 = 0 THEN 'falhou'
    ELSE 'aprovado'
  END AS status_pagamento,
  ROUND(GREATEST(p.valor_bruto - p.desconto_aplicado + COALESCE(p.valor_frete, 0), 0), 2) AS valor_pago,
  CASE
    WHEN p.status_pedido = 'pendente' THEN NULL
    ELSE p.data_pedido + (1 + (p.pedido_id % 6))
  END AS data_pagamento,
  CASE
    WHEN p.pedido_id % 9 = 0 THEN 3
    WHEN p.pedido_id % 4 = 0 THEN 2
    ELSE 1
  END AS parcelas
FROM capstone.pedidos p;

INSERT INTO capstone.pagamentos
SELECT
  100000 + pagamento_id AS pagamento_id,
  pedido_id,
  metodo_pagamento,
  'aprovado' AS status_pagamento,
  valor_pago,
  CASE WHEN data_pagamento IS NULL THEN NULL ELSE data_pagamento + 1 END AS data_pagamento,
  parcelas
FROM capstone.pagamentos
WHERE pagamento_id <= 8000
  AND pedido_id % 211 = 0;

-- reembolsos: defeito dominates (~44% overall), especially in eletronicos (68%)
WITH base AS (
  SELECT
    i AS reembolso_id,
    ip.pedido_id,
    ip.item_id,
    ip.preco_unitario,
    ip.quantidade,
    pr.categoria,
    ((i * 13 + i % 17) % 100) AS motivo_bucket
  FROM (SELECT range::INTEGER AS i FROM range(1, 1201))
  JOIN capstone.itens_pedido ip ON ip.item_id = 1 + ((i * 31) % 24000)
  JOIN capstone.produtos pr ON pr.produto_id = ip.produto_id
)
INSERT INTO capstone.reembolsos
SELECT
  reembolso_id,
  pedido_id,
  item_id,
  ROUND(preco_unitario * quantidade * (0.25 + (reembolso_id % 3) * 0.20), 2) AS valor_reembolso,
  CASE
    WHEN categoria = 'eletronicos' THEN
      CASE WHEN motivo_bucket < 68 THEN 'defeito'
           WHEN motivo_bucket < 84 THEN 'atraso_entrega'
           WHEN motivo_bucket < 93 THEN 'pedido_errado'
           ELSE 'arrependimento' END
    ELSE
      CASE WHEN motivo_bucket < 38 THEN 'defeito'
           WHEN motivo_bucket < 60 THEN 'atraso_entrega'
           WHEN motivo_bucket < 80 THEN 'arrependimento'
           ELSE 'pedido_errado' END
  END AS motivo_reembolso,
  DATE '2024-02-01' + CAST((reembolso_id % 650) AS INTEGER) AS data_reembolso
FROM base;

INSERT INTO capstone.eventos_funil
SELECT
  ROW_NUMBER() OVER () AS evento_id,
  ev.cliente_id,
  ev.sessao_id,
  ev.etapa_funil,
  ev.data_evento,
  ev.canal_midia,
  ev.campanha_id
FROM (
  SELECT
    1 + (s % 800) AS cliente_id,
    'sessao_' || CAST(s AS VARCHAR) AS sessao_id,
    'visita' AS etapa_funil,
    DATE '2024-01-01' + CAST((s % 365) AS INTEGER) AS data_evento,
    CASE s % 5
      WHEN 0 THEN 'paid_search'
      WHEN 1 THEN 'paid_social'
      WHEN 2 THEN 'organic'
      WHEN 3 THEN 'email'
      ELSE 'referral'
    END AS canal_midia,
    1 + (s % 12) AS campanha_id
  FROM (SELECT range::INTEGER AS s FROM range(1, 12001))

  UNION ALL

  -- add_carrinho: organic/referral/email 66%, paid_search/paid_social 56% (overall ~62%)
  SELECT
    1 + (s % 800) AS cliente_id,
    'sessao_' || CAST(s AS VARCHAR) AS sessao_id,
    'add_carrinho' AS etapa_funil,
    DATE '2024-01-01' + CAST((s % 365) AS INTEGER) AS data_evento,
    CASE s % 5
      WHEN 0 THEN 'paid_search'
      WHEN 1 THEN 'paid_social'
      WHEN 2 THEN 'organic'
      WHEN 3 THEN 'email'
      ELSE 'referral'
    END AS canal_midia,
    1 + (s % 12) AS campanha_id
  FROM (SELECT range::INTEGER AS s FROM range(1, 12001))
  WHERE (s % 5 NOT IN (0, 1) AND s % 100 < 66)
     OR (s % 5 IN (0, 1)     AND s % 100 < 56)

  UNION ALL

  -- checkout: organic/referral/email 42%, paid_search/paid_social 34% (overall ~39%)
  SELECT
    1 + (s % 800) AS cliente_id,
    'sessao_' || CAST(s AS VARCHAR) AS sessao_id,
    'checkout' AS etapa_funil,
    DATE '2024-01-01' + CAST((s % 365) AS INTEGER) AS data_evento,
    CASE s % 5
      WHEN 0 THEN 'paid_search'
      WHEN 1 THEN 'paid_social'
      WHEN 2 THEN 'organic'
      WHEN 3 THEN 'email'
      ELSE 'referral'
    END AS canal_midia,
    1 + (s % 12) AS campanha_id
  FROM (SELECT range::INTEGER AS s FROM range(1, 12001))
  WHERE (s % 5 NOT IN (0, 1) AND s % 100 < 42)
     OR (s % 5 IN (0, 1)     AND s % 100 < 34)

  UNION ALL

  -- compra: organic/referral/email 32%, paid_search/paid_social 18% (overall ~27%)
  SELECT
    1 + (s % 800) AS cliente_id,
    'sessao_' || CAST(s AS VARCHAR) AS sessao_id,
    'compra' AS etapa_funil,
    DATE '2024-01-01' + CAST((s % 365) AS INTEGER) AS data_evento,
    CASE s % 5
      WHEN 0 THEN 'paid_search'
      WHEN 1 THEN 'paid_social'
      WHEN 2 THEN 'organic'
      WHEN 3 THEN 'email'
      ELSE 'referral'
    END AS canal_midia,
    1 + (s % 12) AS campanha_id
  FROM (SELECT range::INTEGER AS s FROM range(1, 12001))
  WHERE (s % 5 NOT IN (0, 1) AND s % 100 < 32)
     OR (s % 5 IN (0, 1)     AND s % 100 < 18)
) ev;

