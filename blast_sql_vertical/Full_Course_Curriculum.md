# Full Course Curriculum — SQL for Analysts
> **Version 2.0** | Target roles: Financial Analyst, Marketing Analyst, Junior Data Analyst
> **Difficulty arc**: Foundations → Core Analytics SQL → Intermediate → Job-Ready Toolkit

---

## Critique

**What exists in the current curriculum and what it gets right:**

- The plain-language framing ("think of a database as a massive spreadsheet") is excellent for the target audience and should be preserved throughout.
- The lesson on OLTP vs OLAP includes a practical food-delivery example — exactly the right approach.
- The filtering module (WHERE, AND/OR, BETWEEN, IN, LIKE, NULL) is solid in coverage and challenge structure.
- Challenges include starter queries, which lowers the intimidation barrier for beginners.
- The "End of Module" previews help students know what's coming.

**What is critically missing:**

- **No ETL vs ELT coverage** — a non-negotiable concept for any modern data role. Completely absent.
- **No cloud data infrastructure** — BigQuery, Snowflake, Redshift-style concepts, data lakes, and lakehouses are nowhere to be found. Students will enter interviews blind.
- **No aggregations module** — GROUP BY, SUM, COUNT, AVG, HAVING, and WHERE vs HAVING are the most-asked interview topics and do not appear.
- **No window functions** — ROW_NUMBER, RANK, LAG/LEAD, moving averages are standard in every analyst job description.
- **No CTEs or subqueries** — real-world SQL is almost never written as flat single-level queries.
- **No date/time handling** — month-over-month, cohorts, and time-series are daily analyst work.
- **No analytics patterns** — funnels, cohorts, attribution, churn metrics are entirely absent despite being core to all three target roles.
- **No data quality with SQL** — checking for NULLs, duplicates, and referential integrity is table stakes in a real job.
- **No performance concepts** — even a conceptual understanding of indexes and partitioning is expected at entry-level.
- **No "good SQL" standards** — readability, formatting, aliasing, and query structure are career differentiators.
- **Checkpoint modules are absent** — there is no integration or review mechanism.

**Pacing problems:**

- Module 1 covers OLTP/OLAP at a conceptual level but immediately drops the thread — the modern infrastructure story is never completed.
- The jump from Module 2 (filtering) directly to Module 3 (multi-table JOINs) skips aggregations entirely, which are foundational before joining.
- The JOIN module contains only 2 challenges with no explanation of join types (INNER vs LEFT), no discussion of join debugging, and no mention of the row-duplication pitfall.
- The filtering module treats NULL handling in isolation without connecting it to the common mistake of `= NULL` (which silently returns nothing).

**Schema fragmentation:**

- The course uses three different schemas (`sales`, `filtering.*`, `food_delivery.*`) with no relationship between them. Students cannot build analytical intuition or muscle memory with a unified data model. A single cohesive practice database is essential.

**Scope vs "80% job-ready":**

- The current curriculum covers roughly 20–25% of what is needed. The filtering and basic SELECT content is solid, but everything from aggregation onward — which comprises the majority of real analyst work — is either missing or a stub.
- The multi-table module is a stub with 2 challenges and no lesson body.

**Mismatches with target roles:**

- Financial Analysts need: aggregations, date math, GROUP BY + HAVING, window functions for running totals and period comparisons.
- Marketing Analysts need: funnel analysis, cohort tables, campaign attribution, CASE WHEN segmentation.
- Junior Data Analysts need: all of the above plus CTEs, data quality checks, and the ability to explain what their query does.
- None of these role-specific patterns appear in the current curriculum.

---

## Updated Curriculum

---

### LEVEL 1 — Foundations

> **Goal**: Understand what SQL is, why it exists, where it lives in the modern world, and write your first real queries.

---

#### Module 1: SQL & The Modern Data World

**Why this module exists**: Before writing a single line of SQL, students need to understand the landscape. This is the "orientation" module — where does data live, how does it move, and where does SQL fit in?

**Learning Objectives**:
1. Explain what SQL is and why companies use it instead of just spreadsheets.
2. Describe what a database is and how tables, rows, and columns relate to each other.
3. Differentiate OLTP from OLAP with a real business example.
4. Explain ETL vs ELT and why ELT has become the modern standard.
5. Name the categories of modern data infrastructure (cloud warehouse, data lake, lakehouse) and describe what each one does.
6. Explain how SQL connects to analytics outputs like dashboards, reports, and funnels.

---

##### Class 1.1 — What Is SQL and Why Does It Matter?

**Business context**: Every company — from a food delivery startup to a Fortune 500 retailer — runs on data stored in databases. SQL is the universal language analysts use to ask those databases questions.

**After this class, the student can**:
- Explain SQL in plain English to a non-technical colleague.
- Describe the difference between "clicking filters in Excel" vs "writing a query."
- Explain what "declarative language" means without technical jargon.
- Identify three types of business questions that require SQL.

**Challenges**:

```sql
-- Challenge 1.1.1: Your first query
-- Business context: You work at GrooveCommerce, an e-commerce platform.
-- Your manager asks: "Can you pull everything from the customers table?"
-- Write a query that returns all columns and all rows from the customers table.

SELECT *
FROM customers;
```

```sql
-- Challenge 1.1.2: Select specific columns
-- Your manager says: "Actually, I just need customer names and emails for a marketing list."
-- Return only first_name, last_name, and email from the customers table.

SELECT first_name, last_name, email
FROM customers;
```

```sql
-- Challenge 1.1.3: Business question framing
-- A new analyst joins and asks: "How is using SQL different from just using a spreadsheet?"
-- Write the query that answers: "Show me the 10 most recent orders."
-- (Hint: sort by created_at descending, limit 10 rows)

SELECT *
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

---

##### Class 1.2 — What Is a Database? Tables, Rows, and Columns

**Business context**: GrooveCommerce has a database with tables for customers, orders, products, and marketing campaigns. Understanding what each piece means is the first step to asking useful questions.

**After this class, the student can**:
- Describe the difference between a database, a table, a row, and a column.
- Explain what a primary key is (the unique ID for each row).
- Explain what a foreign key is (a column that connects one table to another).
- Describe why data types (text, number, date) matter when writing queries.

**Challenges**:

```sql
-- Challenge 1.2.1: Explore a table's data
-- You've been given access to the products table.
-- Return all columns from products to see what's inside.

SELECT *
FROM products;
```

```sql
-- Challenge 1.2.2: Spot the primary key
-- The products table has a product_id column (the primary key).
-- Return only product_id and product_name to see the identifier-to-name relationship.

SELECT product_id, product_name
FROM products;
```

```sql
-- Challenge 1.2.3: Follow a foreign key
-- The order_items table has a product_id column (foreign key referencing products).
-- Return order_item_id, order_id, product_id, and quantity from order_items.
-- This shows how one table "points to" another.

SELECT order_item_id, order_id, product_id, quantity
FROM order_items;
```

---

##### Class 1.3 — OLTP vs OLAP: Two Jobs, Two Types of Database

**Business context**: GrooveCommerce uses two different systems: one processes live customer orders in real time (OLTP), and another is used by the analytics team to run reports and dashboards (OLAP). Knowing which system you're querying changes how you write queries.

**After this class, the student can**:
- Explain what OLTP does and give three real-world examples.
- Explain what OLAP does and give three real-world examples.
- Describe why you don't run heavy analytical queries on the production OLTP database.
- Identify which system an analyst typically works in.

**Challenges**:

```sql
-- Challenge 1.3.1: OLTP-style lookup (fast, specific)
-- In an OLTP system, you look up individual records quickly.
-- Return all columns from orders where order_id = 1042.

SELECT *
FROM orders
WHERE order_id = 1042;
```

```sql
-- Challenge 1.3.2: OLAP-style aggregation (analytical, broad)
-- In an OLAP/warehouse context, you summarize large data sets.
-- Return the total number of orders ever placed (count all rows in the orders table).

SELECT COUNT(*) AS total_orders
FROM orders;
```

```sql
-- Challenge 1.3.3: Scale the analysis
-- An analyst at GrooveCommerce needs to know total revenue per month.
-- Return order_month and total_revenue — this is a typical OLAP query.
-- Use DATE_TRUNC('month', created_at) AS order_month and SUM(order_total) AS total_revenue.

SELECT
  DATE_TRUNC('month', created_at) AS order_month,
  SUM(order_total) AS total_revenue
FROM orders
GROUP BY 1
ORDER BY 1;
```

> ⚠️ **Common Mistake Callout**: You haven't learned GROUP BY yet — don't worry about the syntax. The point here is to *see* what an analytical query looks like and how different it is from a single-row lookup. You'll master GROUP BY in Module 4.

---

##### Class 1.4 — ETL, ELT, and How Data Moves Into the Warehouse

**Business context**: Data doesn't magically appear in the analytics warehouse. Someone (or some tool) has to move it there from the live systems. Understanding this pipeline helps analysts know *why* data sometimes looks different in the warehouse vs the live app.

**After this class, the student can**:
- Explain ETL (Extract, Transform, Load) and where transformations happen.
- Explain ELT (Extract, Load, Transform) and why it's now the dominant approach in the cloud.
- Name two types of tools that perform ELT (e.g., Fivetran/Airbyte for extraction; dbt for transformation).
- Explain why an analyst might see "raw" tables vs "transformed" tables in a data warehouse.

**Challenges**:

```sql
-- Challenge 1.4.1: Raw vs transformed data
-- In an ELT pipeline, raw data lands in the warehouse first.
-- The raw orders table might have status codes like 1, 2, 3 instead of labels.
-- Return order_id, status_code from orders to see what raw status values exist.

SELECT DISTINCT status_code
FROM orders
ORDER BY status_code;
```

```sql
-- Challenge 1.4.2: Transformation with CASE WHEN (preview)
-- A transformation (like dbt would do) maps codes to labels.
-- Return order_id and a human-readable status using CASE WHEN.
-- (You'll learn CASE WHEN fully in Module 7 — this is just a preview.)

SELECT
  order_id,
  CASE
    WHEN status_code = 1 THEN 'pending'
    WHEN status_code = 2 THEN 'confirmed'
    WHEN status_code = 3 THEN 'shipped'
    WHEN status_code = 4 THEN 'delivered'
    WHEN status_code = 5 THEN 'cancelled'
    ELSE 'unknown'
  END AS status_label
FROM orders;
```

```sql
-- Challenge 1.4.3: Freshness check
-- In ELT systems, data is loaded on a schedule (e.g., every hour).
-- A quick way to check data freshness is to find the most recent record.
-- Return the maximum created_at from the orders table as latest_order_time.

SELECT MAX(created_at) AS latest_order_time
FROM orders;
```

---

##### Class 1.5 — Cloud Data Warehouses, Data Lakes, and Lakehouses

**Business context**: In a modern company, the analytics team almost never works directly on the production database. They work in a cloud data warehouse (like Snowflake, BigQuery, or Redshift), and increasingly in a lakehouse. Knowing what these are — even conceptually — makes you a smarter analyst.

**After this class, the student can**:
- Describe what a cloud data warehouse is and name three examples (as categories, not vendor endorsements).
- Explain what a data lake is and why it exists alongside a warehouse.
- Explain what a lakehouse is and why it emerged (combining the best of both).
- Describe why SQL still works in all three environments.

**Challenges**:

```sql
-- Challenge 1.5.1: Warehouse-style query — aggregate everything
-- Cloud warehouses are built for large analytical scans. Run this to get familiar.
-- Return count of customers, total orders, and total revenue in one query.

SELECT
  (SELECT COUNT(*) FROM customers)    AS total_customers,
  (SELECT COUNT(*) FROM orders)       AS total_orders,
  (SELECT SUM(order_total) FROM orders) AS total_revenue;
```

```sql
-- Challenge 1.5.2: What goes in a data lake? (Structured exploration)
-- Data lakes often store event-level raw data (like every click, every page view).
-- The sessions table in our schema represents web session data.
-- Return all columns from sessions for the first 5 rows to see its structure.

SELECT *
FROM sessions
LIMIT 5;
```

```sql
-- Challenge 1.5.3: Cross-domain joins (Lakehouse pattern preview)
-- A lakehouse combines warehouse tables with event-level data.
-- Return customer_id, email, and their session count.
-- Join customers with sessions on customer_id.

SELECT
  c.customer_id,
  c.email,
  COUNT(s.session_id) AS session_count
FROM customers c
LEFT JOIN sessions s ON c.customer_id = s.customer_id
GROUP BY c.customer_id, c.email
ORDER BY session_count DESC
LIMIT 10;
```

---

#### ✅ Checkpoint A — Foundations Review

**Purpose**: Confirm students understand *why* they're learning SQL before they go deeper. This is a conceptual + light SQL checkpoint.

**Skills tested**: Class 1.1–1.5 (SQL purpose, database structure, OLTP/OLAP, ETL/ELT, infrastructure concepts, basic SELECT)

**Checkpoint Challenges**:

```sql
-- Checkpoint A.1: Full company snapshot
-- Your first day as a junior analyst at GrooveCommerce. Your manager asks for a
-- "quick snapshot" of the data. Return the count of rows from four tables:
-- customers, orders, products, and marketing_campaigns.
-- Use subqueries in a single SELECT (as shown in Class 1.5.1).

SELECT
  (SELECT COUNT(*) FROM customers)            AS customer_count,
  (SELECT COUNT(*) FROM orders)               AS order_count,
  (SELECT COUNT(*) FROM products)             AS product_count,
  (SELECT COUNT(*) FROM marketing_campaigns)  AS campaign_count;
```

```sql
-- Checkpoint A.2: Spot the freshness problem
-- Return the min and max created_at from the orders table.
-- Use MIN() and MAX(). Label them as oldest_order and newest_order.

SELECT
  MIN(created_at) AS oldest_order,
  MAX(created_at) AS newest_order
FROM orders;
```

```sql
-- Checkpoint A.3: Structured exploration
-- Return product_id, product_name, category_id, and price
-- from the products table, ordered by price descending.

SELECT product_id, product_name, category_id, price
FROM products
ORDER BY price DESC;
```

---

### LEVEL 2 — Core Analytics SQL

> **Goal**: Filter, summarize, and combine data across tables. This is the daily work of a financial, marketing, or junior data analyst.

---

#### Module 2: Filtering & Slicing Data

**Why this module exists**: Analysis almost always starts with a filter. "Show me orders from last quarter." "Show me customers in the US who haven't purchased in 60 days." The WHERE clause is the analyst's primary scalpel.

**Learning Objectives**:
1. Filter rows using WHERE with comparison operators.
2. Combine multiple conditions with AND, OR, and parentheses.
3. Filter ranges with BETWEEN and sets with IN.
4. Match text patterns using LIKE.
5. Handle missing values correctly using IS NULL and IS NOT NULL.
6. Sort and limit results using ORDER BY and LIMIT.

---

##### Class 2.1 — WHERE and Comparison Operators

**Business context**: GrooveCommerce's finance team needs to find large orders for reconciliation. Your job is to filter the orders table to surface the relevant rows.

**After this class, the student can**:
- Write a WHERE clause using =, !=, >, <, >=, <=.
- Explain the difference between = and != in plain language.
- Filter a date column using a comparison operator.
- Combine a column filter with a sort.

> ⚠️ **Common Mistake Callout**: `WHERE status = NULL` will never return any rows. NULL is not a value — it's the *absence* of a value. Always use `IS NULL`. You'll practice this properly in Class 2.5.

**Challenges**:

```sql
-- Challenge 2.1.1: High-value orders
-- Finance wants to review all orders over $500.
-- Return all columns from orders where order_total > 500.

SELECT *
FROM orders
WHERE order_total > 500;
```

```sql
-- Challenge 2.1.2: Orders not yet delivered
-- Operations wants to see orders that are NOT in 'delivered' status.
-- Return order_id, customer_id, status_code, created_at from orders
-- where status_code != 4 (4 = delivered in our schema).

SELECT order_id, customer_id, status_code, created_at
FROM orders
WHERE status_code != 4;
```

```sql
-- Challenge 2.1.3: Orders placed in 2024
-- Return order_id, customer_id, order_total from orders
-- where created_at >= '2024-01-01'.
-- Sort by created_at ascending.

SELECT order_id, customer_id, order_total
FROM orders
WHERE created_at >= '2024-01-01'
ORDER BY created_at ASC;
```

---

##### Class 2.2 — AND, OR, and Parentheses

**Business context**: Marketing needs customers who are in the US AND have an email address. Finance needs orders that are either cancelled OR refunded. Combining conditions precisely is essential.

**After this class, the student can**:
- Combine two filters using AND.
- Combine two filters using OR.
- Use parentheses to control logic order (AND before OR without parentheses can cause bugs).
- Describe what happens when AND and OR are mixed without parentheses.

> ⚠️ **Common Mistake Callout**: `WHERE status = 'cancelled' OR status = 'refunded' AND order_total > 100` does NOT work as most people expect. SQL evaluates AND before OR (like multiplication before addition). Use parentheses: `WHERE (status = 'cancelled' OR status = 'refunded') AND order_total > 100`.

**Challenges**:

```sql
-- Challenge 2.2.1: AND — high-value delivered orders
-- Finance wants large orders that were successfully delivered.
-- Return order_id, order_total, status_code from orders
-- where order_total > 200 AND status_code = 4.

SELECT order_id, order_total, status_code
FROM orders
WHERE order_total > 200
  AND status_code = 4;
```

```sql
-- Challenge 2.2.2: OR — multi-status filter
-- Operations wants to see orders that are either pending (1) or confirmed (2).
-- Return order_id, customer_id, status_code, created_at from orders.

SELECT order_id, customer_id, status_code, created_at
FROM orders
WHERE status_code = 1
   OR status_code = 2;
```

```sql
-- Challenge 2.2.3: Parentheses matter
-- Finance wants orders that are either pending or confirmed,
-- AND with an order_total above 100.
-- Return order_id, order_total, status_code.
-- Use parentheses to get the logic right.

SELECT order_id, order_total, status_code
FROM orders
WHERE (status_code = 1 OR status_code = 2)
  AND order_total > 100;
```

---

##### Class 2.3 — BETWEEN and IN

**Business context**: Reporting often requires range filters ("orders in Q1") and list filters ("customers in these countries"). BETWEEN and IN make these cleaner than chaining multiple AND/OR conditions.

**After this class, the student can**:
- Filter a numeric range using BETWEEN.
- Filter a date range using BETWEEN.
- Filter a column against a list of values using IN.
- Combine IN with AND for multi-condition filtering.

**Challenges**:

```sql
-- Challenge 2.3.1: Q1 2024 orders
-- Finance needs all orders placed in Q1 2024 (Jan 1 – Mar 31).
-- Return order_id, created_at, order_total from orders
-- where created_at BETWEEN '2024-01-01' AND '2024-03-31'.

SELECT order_id, created_at, order_total
FROM orders
WHERE created_at BETWEEN '2024-01-01' AND '2024-03-31';
```

```sql
-- Challenge 2.3.2: Mid-range products
-- The merchandising team wants products priced between $20 and $100.
-- Return product_id, product_name, price from products
-- where price BETWEEN 20 AND 100, sorted by price ascending.

SELECT product_id, product_name, price
FROM products
WHERE price BETWEEN 20 AND 100
ORDER BY price ASC;
```

```sql
-- Challenge 2.3.3: Specific status codes with IN
-- Return order_id, status_code from orders
-- where status_code is 3 (shipped) or 4 (delivered) — use IN.
-- Sort by order_id.

SELECT order_id, status_code
FROM orders
WHERE status_code IN (3, 4)
ORDER BY order_id;
```

---

##### Class 2.4 — LIKE and Pattern Matching

**Business context**: Marketing is cleaning up the customer email list. They need to find records with specific email domains, or customers whose names start with certain letters. LIKE makes text pattern-matching possible.

**After this class, the student can**:
- Use LIKE with % for "starts with," "ends with," and "contains" patterns.
- Use LIKE with _ for single-character matching.
- Combine LIKE with other conditions using AND.
- Explain when NOT LIKE is useful.

**Challenges**:

```sql
-- Challenge 2.4.1: Gmail customers
-- Marketing wants to target Gmail users.
-- Return customer_id, email from customers where email ends with '@gmail.com'.

SELECT customer_id, email
FROM customers
WHERE email LIKE '%@gmail.com';
```

```sql
-- Challenge 2.4.2: Product name contains keyword
-- A merchandiser wants to find all products with "pro" in the name.
-- Return product_id, product_name from products where product_name LIKE '%pro%'.

SELECT product_id, product_name
FROM products
WHERE LOWER(product_name) LIKE '%pro%';
```

```sql
-- Challenge 2.4.3: Clean data check
-- Find customers whose first_name starts with 'A' AND email ends with '.com'.
-- Return customer_id, first_name, email.

SELECT customer_id, first_name, email
FROM customers
WHERE first_name LIKE 'A%'
  AND email LIKE '%.com';
```

---

##### Class 2.5 — NULL: The Silent Data Problem

**Business context**: Some customers haven't filled in their phone number. Some orders don't have a delivery date yet. NULL is not zero, not an empty string — it's the absence of data. Treating it wrong is one of the most common analyst errors.

**After this class, the student can**:
- Explain what NULL means (not zero, not blank — absence of a value).
- Filter for NULL correctly using IS NULL.
- Filter for non-NULL values using IS NOT NULL.
- Explain why `WHERE column = NULL` always returns zero rows (and why that's a silent bug).

> ⚠️ **Common Mistake Callout**: `WHERE phone = NULL` will never return rows. NULL cannot equal anything — including itself. `NULL = NULL` evaluates to NULL, not TRUE. Always use `IS NULL` or `IS NOT NULL`.

**Challenges**:

```sql
-- Challenge 2.5.1: Missing phone numbers
-- CRM team wants customers who haven't provided a phone number.
-- Return customer_id, first_name, last_name, phone
-- from customers where phone IS NULL.

SELECT customer_id, first_name, last_name, phone
FROM customers
WHERE phone IS NULL;
```

```sql
-- Challenge 2.5.2: Orders without delivery date
-- Orders in 'shipped' status (3) should have a delivery_date once delivered.
-- Return order_id, status_code from orders where delivery_date IS NULL.

SELECT order_id, status_code
FROM orders
WHERE delivery_date IS NULL;
```

```sql
-- Challenge 2.5.3: Combined NULL check (data quality)
-- Find customers who have NO phone AND NO email (both are NULL).
-- This helps find "ghost" records with no contact info.

SELECT customer_id, first_name, last_name
FROM customers
WHERE phone IS NULL
  AND email IS NULL;
```

---

##### Class 2.6 — ORDER BY, LIMIT, and OFFSET

**Business context**: The CEO asks for the "top 10 products by revenue." The finance director wants to see the 20 most expensive orders. Sorting and limiting is how you surface the most relevant data quickly.

**After this class, the student can**:
- Sort results ascending (ASC) and descending (DESC).
- Sort by multiple columns.
- Limit results to the top N rows.
- Use OFFSET for basic pagination.

**Challenges**:

```sql
-- Challenge 2.6.1: Top 10 most expensive orders
-- Return order_id, customer_id, order_total from orders
-- ordered by order_total DESC, limit 10.

SELECT order_id, customer_id, order_total
FROM orders
ORDER BY order_total DESC
LIMIT 10;
```

```sql
-- Challenge 2.6.2: Most recently created customers
-- Return customer_id, first_name, email, created_at from customers
-- sorted by created_at DESC, limit 20.

SELECT customer_id, first_name, email, created_at
FROM customers
ORDER BY created_at DESC
LIMIT 20;
```

```sql
-- Challenge 2.6.3: Multi-column sort
-- Return order_id, status_code, order_total from orders
-- sorted first by status_code ASC, then by order_total DESC.

SELECT order_id, status_code, order_total
FROM orders
ORDER BY status_code ASC, order_total DESC;
```

---

#### Module 3: Aggregating Data — COUNT, SUM, GROUP BY, HAVING

**Why this module exists**: This is the heart of analytical SQL. Every dashboard, every financial report, every marketing summary is built on aggregations. GROUP BY is the single most important concept in this course.

**Learning Objectives**:
1. Use COUNT, SUM, AVG, MIN, and MAX to summarize data.
2. Group results by one or more columns using GROUP BY.
3. Filter aggregated results using HAVING.
4. Explain the difference between WHERE (filters rows before aggregation) and HAVING (filters after).
5. Use COUNT(DISTINCT ...) to count unique values.
6. Combine aggregations with ORDER BY to create ranked summaries.

---

##### Class 3.1 — Aggregate Functions: COUNT, SUM, AVG, MIN, MAX

**Business context**: The finance team asks: "How much revenue did we generate last month? What's the average order size? What was the biggest single order?" These questions all require aggregate functions.

**After this class, the student can**:
- Use COUNT(*) to count all rows and COUNT(column) to count non-NULL values.
- Use SUM to total a numeric column.
- Use AVG, MIN, and MAX on numeric and date columns.
- Explain why COUNT(*) and COUNT(column) can return different numbers.

> ⚠️ **Common Mistake Callout**: `COUNT(column)` ignores NULLs. `COUNT(*)` counts every row including NULLs. If you want to know how many customers have an email address, use `COUNT(email)` — not `COUNT(*)`.

**Challenges**:

```sql
-- Challenge 3.1.1: Revenue summary
-- Finance wants the total revenue, average order value, and largest single order.
-- Return total_revenue, avg_order_value, max_order_total from orders.

SELECT
  SUM(order_total)  AS total_revenue,
  AVG(order_total)  AS avg_order_value,
  MAX(order_total)  AS max_order_total
FROM orders;
```

```sql
-- Challenge 3.1.2: Count with and without NULLs
-- How many customers are there? How many have a phone number on file?
-- Return total_customers and customers_with_phone.

SELECT
  COUNT(*)     AS total_customers,
  COUNT(phone) AS customers_with_phone
FROM customers;
```

```sql
-- Challenge 3.1.3: Date range aggregation
-- Finance needs Q1 2024 revenue (Jan 1 – Mar 31).
-- Return total orders and total revenue for that period only.

SELECT
  COUNT(*)         AS q1_orders,
  SUM(order_total) AS q1_revenue
FROM orders
WHERE created_at BETWEEN '2024-01-01' AND '2024-03-31';
```

---

##### Class 3.2 — GROUP BY: Aggregating by Category

**Business context**: The merchandising team wants to see revenue broken down by product category. The operations team wants to count how many orders exist at each status. GROUP BY is how you add "by category" to any aggregation.

**After this class, the student can**:
- Write a GROUP BY query with one grouping column.
- Write a GROUP BY query with multiple grouping columns.
- Explain the rule: every column in SELECT must either be in GROUP BY or inside an aggregate function.
- Sort grouped results by the aggregate value.

> ⚠️ **Common Mistake Callout**: Every column in your SELECT that is NOT inside an aggregate (SUM, COUNT, etc.) MUST appear in the GROUP BY. If it doesn't, most databases will throw an error. A few (like MySQL) will silently return wrong data — which is worse.

**Challenges**:

```sql
-- Challenge 3.2.1: Orders per status
-- Operations wants a count of orders grouped by status_code.
-- Return status_code and order_count, sorted by order_count DESC.

SELECT
  status_code,
  COUNT(*) AS order_count
FROM orders
GROUP BY status_code
ORDER BY order_count DESC;
```

```sql
-- Challenge 3.2.2: Revenue by category
-- Finance wants total revenue by product category.
-- Join order_items with products, group by category_id.
-- Return category_id and total_revenue, sorted by total_revenue DESC.

SELECT
  p.category_id,
  SUM(oi.unit_price * oi.quantity) AS total_revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
GROUP BY p.category_id
ORDER BY total_revenue DESC;
```

```sql
-- Challenge 3.2.3: Customers per acquisition channel
-- Marketing wants to know how many customers came from each acquisition_channel.
-- Return acquisition_channel and customer_count, sorted descending.

SELECT
  acquisition_channel,
  COUNT(*) AS customer_count
FROM customers
GROUP BY acquisition_channel
ORDER BY customer_count DESC;
```

---

##### Class 3.3 — WHERE vs HAVING: Pre- and Post-Aggregation Filters

**Business context**: You want to see only the product categories where total revenue exceeds $10,000. You can't use WHERE for this because the revenue figure doesn't exist until after GROUP BY runs. This is exactly what HAVING is for.

**After this class, the student can**:
- Filter rows before aggregation using WHERE.
- Filter aggregated results using HAVING.
- Combine WHERE and HAVING in a single query.
- Explain why `WHERE SUM(order_total) > 1000` throws an error.

> ⚠️ **Common Mistake Callout**: `WHERE SUM(order_total) > 1000` will always fail — you cannot use aggregate functions inside a WHERE clause. WHERE runs before GROUP BY and doesn't know what SUM is yet. Use HAVING for post-aggregation filters.

**Challenges**:

```sql
-- Challenge 3.3.1: HAVING only
-- Find all acquisition_channels with more than 50 customers.
-- Return acquisition_channel and customer_count.

SELECT
  acquisition_channel,
  COUNT(*) AS customer_count
FROM customers
GROUP BY acquisition_channel
HAVING COUNT(*) > 50;
```

```sql
-- Challenge 3.3.2: WHERE + GROUP BY + HAVING
-- For delivered orders (status_code = 4) only,
-- find customers who have placed more than 3 delivered orders.
-- Return customer_id and delivered_order_count.

SELECT
  customer_id,
  COUNT(*) AS delivered_order_count
FROM orders
WHERE status_code = 4
GROUP BY customer_id
HAVING COUNT(*) > 3;
```

```sql
-- Challenge 3.3.3: High-revenue categories from 2024
-- For orders placed in 2024, find product categories with total revenue > $5,000.
-- Join order_items + products, filter by year, group by category, filter by revenue.

SELECT
  p.category_id,
  SUM(oi.unit_price * oi.quantity) AS total_revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.created_at >= '2024-01-01' AND o.created_at < '2025-01-01'
GROUP BY p.category_id
HAVING SUM(oi.unit_price * oi.quantity) > 5000
ORDER BY total_revenue DESC;
```

---

##### Class 3.4 — COUNT(DISTINCT) and Unique Value Counting

**Business context**: Marketing wants to know how many *unique* customers placed orders last month — not how many orders there were. These are very different numbers. COUNT(DISTINCT) is the answer.

**After this class, the student can**:
- Use COUNT(DISTINCT column) to count unique values.
- Explain the difference between COUNT(*), COUNT(column), and COUNT(DISTINCT column).
- Apply COUNT(DISTINCT) in a GROUP BY query.
- Use it to detect duplicates in a dataset.

**Challenges**:

```sql
-- Challenge 3.4.1: Unique customers who ordered
-- How many unique customers placed at least one order?
-- Return unique_ordering_customers.

SELECT COUNT(DISTINCT customer_id) AS unique_ordering_customers
FROM orders;
```

```sql
-- Challenge 3.4.2: Unique products ordered per category
-- Marketing wants to know how many distinct products were sold per category.
-- Join order_items + products, group by category_id.

SELECT
  p.category_id,
  COUNT(DISTINCT oi.product_id) AS unique_products_sold
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
GROUP BY p.category_id
ORDER BY unique_products_sold DESC;
```

```sql
-- Challenge 3.4.3: Duplicate detection
-- Are there any customers with the same email address (potential duplicates)?
-- Return email and count, only where count > 1.

SELECT
  email,
  COUNT(*) AS email_count
FROM customers
GROUP BY email
HAVING COUNT(*) > 1;
```

---

#### ✅ Checkpoint B — Core Analytics SQL Review

**Purpose**: Students should now be able to filter, aggregate, and reason about data. This checkpoint uses multi-step business scenarios.

**Checkpoint Challenges**:

```sql
-- Checkpoint B.1: Monthly revenue report
-- Finance wants total revenue and order count per month for 2024.
-- Return order_month, order_count, and total_revenue.
-- Use DATE_TRUNC('month', created_at) for the month column.

SELECT
  DATE_TRUNC('month', created_at) AS order_month,
  COUNT(*)                        AS order_count,
  SUM(order_total)                AS total_revenue
FROM orders
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'
GROUP BY 1
ORDER BY 1;
```

```sql
-- Checkpoint B.2: Top customers by spend
-- Return the top 10 customers by total spend.
-- Include customer_id, total_orders, and lifetime_value (total order_total).
-- Sort by lifetime_value DESC.

SELECT
  customer_id,
  COUNT(*)         AS total_orders,
  SUM(order_total) AS lifetime_value
FROM orders
WHERE status_code != 5  -- exclude cancelled
GROUP BY customer_id
ORDER BY lifetime_value DESC
LIMIT 10;
```

```sql
-- Checkpoint B.3: Category health check
-- For each product category, return:
-- category_id, total_products (from products table), avg_price, min_price, max_price.

SELECT
  category_id,
  COUNT(*)      AS total_products,
  AVG(price)    AS avg_price,
  MIN(price)    AS min_price,
  MAX(price)    AS max_price
FROM products
GROUP BY category_id
ORDER BY total_products DESC;
```

---

#### Module 4: Joining Tables

**Why this module exists**: A single table almost never contains everything you need. Real business questions require combining data from two, three, or more tables. Joins are where beginners most often make silent, costly mistakes.

**Learning Objectives**:
1. Explain what a JOIN does conceptually (combine rows from two tables using a matching key).
2. Write an INNER JOIN and explain what rows it excludes.
3. Write a LEFT JOIN and explain what happens to unmatched rows.
4. Debug a join that produces more rows than expected (the duplication trap).
5. Join three tables in a single query.
6. Distinguish when to use INNER vs LEFT JOIN.

---

##### Class 4.1 — INNER JOIN: Matching Records Only

**Business context**: You want to see orders alongside customer names. Both pieces of data live in separate tables (orders and customers). An INNER JOIN connects them — but only returns rows where there's a match on both sides.

**After this class, the student can**:
- Write a two-table INNER JOIN with a ON clause.
- Use table aliases to make queries readable.
- Explain that INNER JOIN excludes rows with no match (this can lose data silently).
- Select specific columns from each table using `alias.column` syntax.

> ⚠️ **Common Mistake Callout**: INNER JOIN silently drops rows with no match. If an order has no customer (because the customer was deleted), it disappears from your results. This can make your numbers look wrong. Always ask: "What rows might I be dropping?"

**Challenges**:

```sql
-- Challenge 4.1.1: Orders with customer names
-- Return order_id, order_total, and the customer's first_name and last_name.
-- Join orders with customers on customer_id.

SELECT
  o.order_id,
  o.order_total,
  c.first_name,
  c.last_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
ORDER BY o.order_id;
```

```sql
-- Challenge 4.1.2: Order items with product names
-- Return order_item_id, order_id, product_name, quantity, unit_price.
-- Join order_items with products on product_id.

SELECT
  oi.order_item_id,
  oi.order_id,
  p.product_name,
  oi.quantity,
  oi.unit_price
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id;
```

```sql
-- Challenge 4.1.3: Three-table join
-- Return order_id, customer email, product_name, and quantity for all order items.
-- Join orders → customers, orders → order_items → products.

SELECT
  o.order_id,
  c.email,
  p.product_name,
  oi.quantity
FROM orders o
JOIN customers c       ON o.customer_id = c.customer_id
JOIN order_items oi    ON o.order_id = oi.order_id
JOIN products p        ON oi.product_id = p.product_id
ORDER BY o.order_id;
```

---

##### Class 4.2 — LEFT JOIN: Keep Everything on the Left

**Business context**: You want a list of all customers and how many orders each has placed. Some customers have never ordered. INNER JOIN would make them disappear. LEFT JOIN keeps them — with NULL in the order columns.

**After this class, the student can**:
- Write a LEFT JOIN and explain what NULLs mean in the result.
- Use a LEFT JOIN + `WHERE right_table.id IS NULL` to find "unmatched" rows (e.g., customers who never ordered).
- Explain the difference between LEFT JOIN and INNER JOIN with a concrete example.
- Describe when RIGHT JOIN is redundant (just swap the table order and use LEFT JOIN).

> ⚠️ **Common Mistake Callout**: If you add a WHERE filter on the right-side table in a LEFT JOIN, you've secretly turned it into an INNER JOIN. `LEFT JOIN orders ON ... WHERE orders.status = 'delivered'` will drop all NULL rows. Move filters to the ON clause if you want to keep unmatched rows.

**Challenges**:

```sql
-- Challenge 4.2.1: All customers, with or without orders
-- Return every customer's customer_id, first_name, and their order count.
-- Customers with no orders should show 0.
-- Use LEFT JOIN + COUNT + COALESCE.

SELECT
  c.customer_id,
  c.first_name,
  COUNT(o.order_id) AS order_count
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.first_name
ORDER BY order_count DESC;
```

```sql
-- Challenge 4.2.2: Customers who have NEVER ordered
-- Use LEFT JOIN and filter for rows where order_id IS NULL on the right side.
-- Return customer_id, first_name, email.

SELECT
  c.customer_id,
  c.first_name,
  c.email
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_id IS NULL;
```

```sql
-- Challenge 4.2.3: Products never ordered
-- Return product_id and product_name for products that have never appeared in order_items.

SELECT
  p.product_id,
  p.product_name
FROM products p
LEFT JOIN order_items oi ON p.product_id = oi.product_id
WHERE oi.order_item_id IS NULL;
```

---

##### Class 4.3 — Join Debugging: When Your Row Count is Wrong

**Business context**: You run a join and suddenly your revenue report shows twice the expected total. This is one of the most common and dangerous bugs in analytical SQL. Learning to diagnose and fix it is a critical job skill.

**After this class, the student can**:
- Identify row-multiplication caused by a one-to-many join.
- Use COUNT(*) before and after a join to detect row explosion.
- Fix duplication with aggregation or by restructuring the query.
- Describe what a "fan-out" join problem looks like in a real report.

> ⚠️ **Common Mistake Callout**: When you join a "one" table to a "many" table (e.g., one customer to many orders), then aggregate on the "one" side, your aggregations will be multiplied by the number of rows on the "many" side. Always count rows at each step when debugging joins.

**Challenges**:

```sql
-- Challenge 4.3.1: Diagnose a fan-out
-- Compare the total row count of order_items vs orders.
-- Run these two queries separately and note the difference.

SELECT COUNT(*) AS order_count       FROM orders;
SELECT COUNT(*) AS order_item_count  FROM order_items;
```

```sql
-- Challenge 4.3.2: Safe aggregation after join
-- Calculate total revenue per order correctly.
-- Sum unit_price * quantity from order_items, grouped by order_id.
-- Then join back to orders to get the customer_id.

SELECT
  o.order_id,
  o.customer_id,
  SUM(oi.unit_price * oi.quantity) AS calculated_total
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id, o.customer_id
ORDER BY calculated_total DESC
LIMIT 10;
```

```sql
-- Challenge 4.3.3: Customer-level revenue without fan-out
-- Calculate each customer's lifetime revenue.
-- Do NOT join customers to orders first and then to order_items
-- (that causes fan-out). Instead, aggregate order_items by order_id first, then join.

WITH order_totals AS (
  SELECT order_id, SUM(unit_price * quantity) AS order_revenue
  FROM order_items
  GROUP BY order_id
)
SELECT
  o.customer_id,
  SUM(ot.order_revenue) AS lifetime_revenue
FROM orders o
JOIN order_totals ot ON o.order_id = ot.order_id
GROUP BY o.customer_id
ORDER BY lifetime_revenue DESC
LIMIT 10;
```

---

### LEVEL 3 — Intermediate SQL

> **Goal**: Write real-world multi-step queries. Handle dates, transform messy data, write readable SQL with CTEs, and use window functions.

---

#### Module 5: Dates and Time in SQL

**Why this module exists**: Almost every analytical question involves time. "Revenue this month vs last month." "Customer cohorts by signup quarter." "Rolling 30-day active users." Mastering date functions is a key differentiator for analyst candidates.

**Learning Objectives**:
1. Extract parts of a date (year, month, day, weekday) using date functions.
2. Truncate dates to standard periods (day, week, month, quarter, year).
3. Calculate time differences between two dates.
4. Filter date ranges correctly without losing data at period boundaries.
5. Build month-over-month and week-over-week comparisons.
6. Understand why time zones matter conceptually (and what UTC means).

---

##### Class 5.1 — Extracting and Truncating Dates

**Business context**: Finance needs a monthly revenue table. Marketing needs a weekly sign-up count. The created_at column stores full timestamps — you need to "round" them to the period you care about.

**After this class, the student can**:
- Use DATE_TRUNC to round a timestamp to month, week, quarter, year.
- Use EXTRACT (or DATE_PART) to pull out year, month, day, weekday numbers.
- Explain why `DATE_TRUNC('month', created_at)` is safer than `EXTRACT(month FROM created_at)` for grouping (it preserves the year).
- Group orders by month and count/sum them.

> ⚠️ **Common Mistake Callout**: Grouping by `EXTRACT(month FROM created_at)` WITHOUT year means January 2023 and January 2024 are merged into the same bucket. Always use `DATE_TRUNC('month', created_at)` or `EXTRACT(year FROM ...) + EXTRACT(month FROM ...)` together.

**Challenges**:

```sql
-- Challenge 5.1.1: Monthly order count
-- Return each month (as order_month) and the count of orders in that month.
-- Use DATE_TRUNC. Sort by order_month ascending.

SELECT
  DATE_TRUNC('month', created_at) AS order_month,
  COUNT(*)                        AS order_count
FROM orders
GROUP BY 1
ORDER BY 1;
```

```sql
-- Challenge 5.1.2: Weekly new customer signups
-- Return each week (as signup_week) and the number of new customers that week.

SELECT
  DATE_TRUNC('week', created_at) AS signup_week,
  COUNT(*)                       AS new_customers
FROM customers
GROUP BY 1
ORDER BY 1;
```

```sql
-- Challenge 5.1.3: Orders by day of week
-- Marketing wants to know which days of the week have the most orders.
-- Use EXTRACT(DOW FROM created_at) AS day_of_week (0=Sunday, 6=Saturday).

SELECT
  EXTRACT(DOW FROM created_at) AS day_of_week,
  COUNT(*)                     AS order_count
FROM orders
GROUP BY 1
ORDER BY order_count DESC;
```

---

##### Class 5.2 — Date Arithmetic and Time Differences

**Business context**: How many days between an order being placed and delivered? How many customers signed up in the last 30 days? Date arithmetic is how you answer these questions.

**After this class, the student can**:
- Subtract two dates to get the number of days between them.
- Use CURRENT_DATE or NOW() for "today."
- Filter for records within the last N days.
- Calculate age-based metrics (days since signup, days to delivery).

**Challenges**:

```sql
-- Challenge 5.2.1: Days to delivery
-- For delivered orders (status_code = 4), calculate how many days it took to deliver.
-- Return order_id, created_at, delivery_date, and days_to_deliver.

SELECT
  order_id,
  created_at,
  delivery_date,
  (delivery_date::date - created_at::date) AS days_to_deliver
FROM orders
WHERE status_code = 4
  AND delivery_date IS NOT NULL;
```

```sql
-- Challenge 5.2.2: Customers acquired in the last 90 days
-- Return customer_id, first_name, email, created_at for customers
-- who signed up in the last 90 days from today.

SELECT
  customer_id,
  first_name,
  email,
  created_at
FROM customers
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days';
```

```sql
-- Challenge 5.2.3: Average delivery time per month
-- Group delivered orders by the month they were placed.
-- Return order_month and avg_days_to_deliver (rounded to 1 decimal).

SELECT
  DATE_TRUNC('month', created_at)                               AS order_month,
  ROUND(AVG(delivery_date::date - created_at::date)::numeric, 1) AS avg_days_to_deliver
FROM orders
WHERE status_code = 4
  AND delivery_date IS NOT NULL
GROUP BY 1
ORDER BY 1;
```

---

##### Class 5.3 — Period Comparisons and Cohorts

**Business context**: The CFO asks: "Is revenue growing month over month?" Marketing asks: "Of customers who signed up in January 2024, how many ordered in their first month?" These are the most common analytical questions in any business.

**After this class, the student can**:
- Define what a cohort is (group of users who share a starting event and time period).
- Build a basic signup-cohort table using DATE_TRUNC.
- Write a month-over-month query (preview — full window functions in Module 7).
- Explain why cohort analysis matters for churn and retention.

**Challenges**:

```sql
-- Challenge 5.3.1: Customer cohorts by signup month
-- Assign each customer to a signup cohort (the month they joined).
-- Return signup_cohort and the count of customers in that cohort.

SELECT
  DATE_TRUNC('month', created_at) AS signup_cohort,
  COUNT(*)                        AS cohort_size
FROM customers
GROUP BY 1
ORDER BY 1;
```

```sql
-- Challenge 5.3.2: Did cohort customers order in their signup month?
-- For each customer, find their signup month and their first order month.
-- Return customer_id, signup_cohort, first_order_month.
-- Join customers and orders (use MIN to get first order date).

SELECT
  c.customer_id,
  DATE_TRUNC('month', c.created_at)       AS signup_cohort,
  DATE_TRUNC('month', MIN(o.created_at))  AS first_order_month
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.created_at;
```

```sql
-- Challenge 5.3.3: Conversion rate by signup cohort
-- For each signup cohort, what % of customers placed at least one order?
-- Return signup_cohort, cohort_size, customers_ordered, conversion_rate.

SELECT
  DATE_TRUNC('month', c.created_at) AS signup_cohort,
  COUNT(DISTINCT c.customer_id)     AS cohort_size,
  COUNT(DISTINCT o.customer_id)     AS customers_ordered,
  ROUND(
    COUNT(DISTINCT o.customer_id)::numeric /
    NULLIF(COUNT(DISTINCT c.customer_id), 0) * 100, 1
  )                                 AS conversion_pct
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY 1
ORDER BY 1;
```

---

#### Module 6: Transforming and Cleaning Data

**Why this module exists**: Real-world data is messy. Fields are NULL when they shouldn't be. Status codes need labels. Values need to be categorized. Cleaning and transforming data in SQL is a daily analyst task, and it's also a key input to data quality monitoring.

**Learning Objectives**:
1. Use CASE WHEN to create conditional columns and segments.
2. Use COALESCE to replace NULL values with defaults.
3. Use NULLIF to convert specific values into NULL.
4. Apply basic string functions (UPPER, LOWER, TRIM, CONCAT, SPLIT_PART).
5. Write data quality checks using SQL (duplicates, missing values, referential integrity).
6. Cast column types correctly using CAST or ::.

---

##### Class 6.1 — CASE WHEN: Conditional Logic in SQL

**Business context**: Marketing wants to segment customers into "High Value," "Medium Value," and "Low Value" based on their total spend. The data has numbers — you need labels. CASE WHEN is the SQL equivalent of an IF-THEN-ELSE.

**After this class, the student can**:
- Write a CASE WHEN / THEN / ELSE / END block.
- Create a new column with categorical labels from numeric thresholds.
- Nest CASE WHEN inside aggregate functions (e.g., count customers per segment).
- Use CASE WHEN to handle NULL values in a readable way.

**Challenges**:

```sql
-- Challenge 6.1.1: Order size labels
-- Label each order as 'Small' (< $50), 'Medium' ($50–$200), or 'Large' (> $200).
-- Return order_id, order_total, and order_size_label.

SELECT
  order_id,
  order_total,
  CASE
    WHEN order_total < 50    THEN 'Small'
    WHEN order_total <= 200  THEN 'Medium'
    ELSE                          'Large'
  END AS order_size_label
FROM orders;
```

```sql
-- Challenge 6.1.2: Count orders per size label
-- Using the same label logic, count how many orders fall in each size bucket.
-- Return order_size_label and order_count.

SELECT
  CASE
    WHEN order_total < 50    THEN 'Small'
    WHEN order_total <= 200  THEN 'Medium'
    ELSE                          'Large'
  END AS order_size_label,
  COUNT(*) AS order_count
FROM orders
GROUP BY 1
ORDER BY order_count DESC;
```

```sql
-- Challenge 6.1.3: Status labels for reporting
-- Replace numeric status_code with human-readable labels.
-- Return order_id, order_total, and status_label.

SELECT
  order_id,
  order_total,
  CASE status_code
    WHEN 1 THEN 'Pending'
    WHEN 2 THEN 'Confirmed'
    WHEN 3 THEN 'Shipped'
    WHEN 4 THEN 'Delivered'
    WHEN 5 THEN 'Cancelled'
    ELSE        'Unknown'
  END AS status_label
FROM orders;
```

---

##### Class 6.2 — COALESCE, NULLIF, and Handling Missing Data

**Business context**: A report shows "NULL" in the channel column for some customers. A revenue sum returns NULL because one row has a NULL value. These are silent data problems — COALESCE and NULLIF help you handle them explicitly.

**After this class, the student can**:
- Use COALESCE to replace NULLs with a fallback value.
- Use NULLIF to convert a specific value to NULL (useful to avoid division by zero).
- Explain why `SUM(revenue)` with even one NULL row still works (SUM ignores NULLs).
- Use COALESCE to build "zero-safe" count columns.

> ⚠️ **Common Mistake Callout**: `SUM(a) / SUM(b)` will throw a division-by-zero error if SUM(b) = 0. Use `SUM(a) / NULLIF(SUM(b), 0)` to safely return NULL instead of crashing.

**Challenges**:

```sql
-- Challenge 6.2.1: Replace NULL channels
-- Customers with no acquisition_channel should show 'Unknown'.
-- Return customer_id, first_name, and coalesced_channel.

SELECT
  customer_id,
  first_name,
  COALESCE(acquisition_channel, 'Unknown') AS coalesced_channel
FROM customers;
```

```sql
-- Challenge 6.2.2: Safe conversion rate
-- Calculate conversion rate for marketing campaigns: conversions / clicks.
-- Use NULLIF to avoid division by zero if clicks = 0.

SELECT
  campaign_id,
  campaign_name,
  clicks,
  conversions,
  ROUND(
    conversions::numeric / NULLIF(clicks, 0) * 100, 2
  ) AS conversion_rate_pct
FROM marketing_campaigns;
```

```sql
-- Challenge 6.2.3: COALESCE in aggregation
-- Some orders have a NULL discount_amount. Treat NULL discount as 0.
-- Return order_id, order_total, discount_amount (coalesced), and net_revenue.

SELECT
  order_id,
  order_total,
  COALESCE(discount_amount, 0) AS discount_amount,
  order_total - COALESCE(discount_amount, 0) AS net_revenue
FROM orders;
```

---

##### Class 6.3 — Data Quality Checks with SQL

**Business context**: Before you build a dashboard or send a report to a VP, you need to know your data is clean. Analysts who can proactively run data quality checks using SQL are far more trusted than those who just report numbers blindly.

**After this class, the student can**:
- Check for duplicate rows using GROUP BY + HAVING COUNT > 1.
- Check for referential integrity (e.g., order_items referencing non-existent products).
- Check for unexpected NULL rates in critical columns.
- Summarize data quality issues in a single diagnostic query.

**Challenges**:

```sql
-- Challenge 6.3.1: Duplicate order check
-- Are there any order_ids that appear more than once in the orders table?
-- Return order_id and occurrence_count where count > 1.

SELECT
  order_id,
  COUNT(*) AS occurrence_count
FROM orders
GROUP BY order_id
HAVING COUNT(*) > 1;
```

```sql
-- Challenge 6.3.2: Orphaned order items (referential integrity)
-- Are there order_items that reference a product_id not in the products table?
-- Return order_item_id and product_id for any such orphaned rows.

SELECT
  oi.order_item_id,
  oi.product_id
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.product_id
WHERE p.product_id IS NULL;
```

```sql
-- Challenge 6.3.3: NULL rate summary
-- Build a data quality summary for the customers table.
-- Return column_name and null_count for: email, phone, acquisition_channel.

SELECT 'email'                AS column_name, COUNT(*) - COUNT(email)                AS null_count FROM customers
UNION ALL
SELECT 'phone'                AS column_name, COUNT(*) - COUNT(phone)                AS null_count FROM customers
UNION ALL
SELECT 'acquisition_channel'  AS column_name, COUNT(*) - COUNT(acquisition_channel)  AS null_count FROM customers;
```

---

#### Module 7: CTEs and Subqueries — Writing Readable SQL

**Why this module exists**: Junior analysts who can only write flat 100-line queries are harder to work with and harder to review. CTEs (Common Table Expressions) are the single biggest readability upgrade in SQL — and they're expected in every professional environment.

**Learning Objectives**:
1. Write a subquery in the FROM clause (derived table).
2. Write a subquery in the WHERE clause.
3. Write a CTE using WITH and explain when it's better than a subquery.
4. Chain multiple CTEs together to build a multi-step analysis.
5. Explain what "query readability" means and why it matters in a team setting.
6. Refactor a nested query into a CTE.

---

##### Class 7.1 — Subqueries

**Business context**: You need to find all customers whose total spend is above the average. That requires knowing the average first, then filtering against it. Subqueries let you use the result of one query inside another.

**After this class, the student can**:
- Write a subquery in the WHERE clause to filter against a dynamic value.
- Write a subquery in the FROM clause as a "virtual table."
- Explain why subqueries can be hard to read when nested deeply.
- Use a scalar subquery (returns a single value) in a SELECT list.

**Challenges**:

```sql
-- Challenge 7.1.1: Orders above average order value
-- Return order_id and order_total for orders above the average order_total.
-- Use a scalar subquery in the WHERE clause.

SELECT order_id, order_total
FROM orders
WHERE order_total > (SELECT AVG(order_total) FROM orders)
ORDER BY order_total DESC;
```

```sql
-- Challenge 7.1.2: FROM subquery — customer spend summary
-- Create a derived table that sums spend per customer,
-- then filter for customers who spent more than $500 total.

SELECT customer_id, total_spend
FROM (
  SELECT customer_id, SUM(order_total) AS total_spend
  FROM orders
  WHERE status_code != 5
  GROUP BY customer_id
) AS customer_spend
WHERE total_spend > 500
ORDER BY total_spend DESC;
```

```sql
-- Challenge 7.1.3: IN subquery — customers who ordered in 2024
-- Return customer_id, first_name, email for customers
-- who placed at least one order in 2024.
-- Use a subquery with IN.

SELECT customer_id, first_name, email
FROM customers
WHERE customer_id IN (
  SELECT DISTINCT customer_id
  FROM orders
  WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'
);
```

---

##### Class 7.2 — CTEs: Writing SQL That Reads Like a Story

**Business context**: A marketing analyst needs a multi-step query: first compute campaign performance, then rank campaigns, then filter top performers. A CTE lets you write each step as its own named block — making the logic easy to follow, test, and hand off.

**After this class, the student can**:
- Write a CTE using WITH cte_name AS (...) SELECT ... FROM cte_name.
- Chain two or more CTEs in a single query.
- Explain when to use a CTE vs a subquery.
- Refactor a nested subquery into a CTE.

**Challenges**:

```sql
-- Challenge 7.2.1: First CTE — active customers
-- Define a CTE "active_customers" of customers who ordered in the last 180 days.
-- Then select all columns from that CTE.

WITH active_customers AS (
  SELECT DISTINCT customer_id
  FROM orders
  WHERE created_at >= CURRENT_DATE - INTERVAL '180 days'
)
SELECT c.customer_id, c.first_name, c.email
FROM customers c
JOIN active_customers ac ON c.customer_id = ac.customer_id;
```

```sql
-- Challenge 7.2.2: Chained CTEs — campaign performance
-- CTE 1: sum clicks and conversions per campaign.
-- CTE 2: calculate conversion rate from CTE 1.
-- Final query: return campaigns with conversion_rate > 5%.

WITH campaign_stats AS (
  SELECT
    campaign_id,
    SUM(clicks)      AS total_clicks,
    SUM(conversions) AS total_conversions
  FROM campaign_events
  GROUP BY campaign_id
),
campaign_rates AS (
  SELECT
    cs.campaign_id,
    mc.campaign_name,
    cs.total_clicks,
    cs.total_conversions,
    ROUND(cs.total_conversions::numeric / NULLIF(cs.total_clicks, 0) * 100, 2) AS conversion_rate_pct
  FROM campaign_stats cs
  JOIN marketing_campaigns mc ON cs.campaign_id = mc.campaign_id
)
SELECT *
FROM campaign_rates
WHERE conversion_rate_pct > 5
ORDER BY conversion_rate_pct DESC;
```

```sql
-- Challenge 7.2.3: Refactor a nested query into CTEs
-- Original (hard to read):
-- SELECT * FROM (SELECT customer_id, SUM(order_total) AS ltv
--   FROM (SELECT * FROM orders WHERE status_code != 5) clean_orders
--   GROUP BY customer_id) ltv_table WHERE ltv > 1000;
-- Rewrite this using two CTEs for readability.

WITH clean_orders AS (
  SELECT *
  FROM orders
  WHERE status_code != 5
),
customer_ltv AS (
  SELECT customer_id, SUM(order_total) AS ltv
  FROM clean_orders
  GROUP BY customer_id
)
SELECT *
FROM customer_ltv
WHERE ltv > 1000
ORDER BY ltv DESC;
```

---

#### ✅ Checkpoint C — Intermediate SQL Review

**Checkpoint Challenges**:

```sql
-- Checkpoint C.1: Monthly cohort conversion
-- For each signup cohort (month), calculate how many customers:
-- (a) signed up, (b) placed their first order in the same month (same-month converters).
-- Return signup_cohort, cohort_size, same_month_converters, same_month_conversion_pct.

WITH cohort_base AS (
  SELECT
    customer_id,
    DATE_TRUNC('month', created_at) AS signup_cohort
  FROM customers
),
first_orders AS (
  SELECT
    customer_id,
    DATE_TRUNC('month', MIN(created_at)) AS first_order_month
  FROM orders
  GROUP BY customer_id
)
SELECT
  cb.signup_cohort,
  COUNT(DISTINCT cb.customer_id)    AS cohort_size,
  COUNT(DISTINCT fo.customer_id)    AS same_month_converters,
  ROUND(
    COUNT(DISTINCT fo.customer_id)::numeric /
    NULLIF(COUNT(DISTINCT cb.customer_id), 0) * 100, 1
  )                                 AS same_month_conversion_pct
FROM cohort_base cb
LEFT JOIN first_orders fo
       ON cb.customer_id = fo.customer_id
      AND cb.signup_cohort = fo.first_order_month
GROUP BY 1
ORDER BY 1;
```

```sql
-- Checkpoint C.2: Top 5 products with data quality flags
-- Return the top 5 products by total units sold (from order_items).
-- Include a data_quality_flag column: 'OK' if unit_price matches the products.price,
-- 'PRICE MISMATCH' if they differ.

WITH product_sales AS (
  SELECT
    oi.product_id,
    SUM(oi.quantity)                  AS total_units_sold,
    AVG(oi.unit_price)                AS avg_sold_price
  FROM order_items oi
  GROUP BY oi.product_id
)
SELECT
  ps.product_id,
  p.product_name,
  ps.total_units_sold,
  ps.avg_sold_price,
  p.price               AS catalog_price,
  CASE
    WHEN ROUND(ps.avg_sold_price::numeric, 2) = ROUND(p.price::numeric, 2)
      THEN 'OK'
    ELSE 'PRICE MISMATCH'
  END AS data_quality_flag
FROM product_sales ps
JOIN products p ON ps.product_id = p.product_id
ORDER BY ps.total_units_sold DESC
LIMIT 5;
```

---

#### Module 8: Window Functions

**Why this module exists**: Window functions are the most powerful tool in an analyst's SQL kit — and the one most beginners are missing. They enable running totals, rankings, period-over-period comparisons, and moving averages without collapsing the data like GROUP BY does.

**Learning Objectives**:
1. Explain the difference between window functions and GROUP BY (window functions don't collapse rows).
2. Use ROW_NUMBER, RANK, and DENSE_RANK for ranking.
3. Use LAG and LEAD to compare a row to its previous or next row.
4. Use SUM OVER and AVG OVER for running totals and moving averages.
5. Use PARTITION BY to restart a window calculation per group.
6. Use ORDER BY inside OVER to define the row sequence.

---

##### Class 8.1 — Ranking with ROW_NUMBER, RANK, DENSE_RANK

**Business context**: The sales team wants to rank customers by their total spend. Product wants to rank products within each category by revenue. Ranking is one of the most common window function use cases.

**After this class, the student can**:
- Use ROW_NUMBER() OVER (ORDER BY ...) to assign a unique row number.
- Use RANK() and explain the difference from ROW_NUMBER (ties get the same rank, next rank is skipped).
- Use DENSE_RANK (ties get the same rank, no skip).
- Use PARTITION BY to reset rankings within a group.

> ⚠️ **Common Mistake Callout**: ROW_NUMBER always gives unique numbers — even to ties. RANK gives the same number to ties but skips (1, 1, 3). DENSE_RANK gives the same number to ties and does not skip (1, 1, 2). Pick based on what the business question actually needs.

**Challenges**:

```sql
-- Challenge 8.1.1: Rank customers by lifetime value
-- Assign each customer a rank by their total non-cancelled spend.
-- Return customer_id, lifetime_value, and ltv_rank.

SELECT
  customer_id,
  SUM(order_total) AS lifetime_value,
  RANK() OVER (ORDER BY SUM(order_total) DESC) AS ltv_rank
FROM orders
WHERE status_code != 5
GROUP BY customer_id
ORDER BY ltv_rank;
```

```sql
-- Challenge 8.1.2: Rank products within each category
-- For each category, rank products by their total revenue.
-- Return category_id, product_id, product_revenue, and rank_in_category.

WITH product_revenue AS (
  SELECT
    p.category_id,
    p.product_id,
    p.product_name,
    SUM(oi.unit_price * oi.quantity) AS product_revenue
  FROM products p
  JOIN order_items oi ON p.product_id = oi.product_id
  GROUP BY p.category_id, p.product_id, p.product_name
)
SELECT
  category_id,
  product_id,
  product_name,
  product_revenue,
  RANK() OVER (PARTITION BY category_id ORDER BY product_revenue DESC) AS rank_in_category
FROM product_revenue
ORDER BY category_id, rank_in_category;
```

```sql
-- Challenge 8.1.3: Top 1 product per category (filter using rank)
-- Using the same logic as 8.1.2, return ONLY the #1 ranked product per category.

WITH product_revenue AS (
  SELECT
    p.category_id,
    p.product_id,
    p.product_name,
    SUM(oi.unit_price * oi.quantity) AS product_revenue
  FROM products p
  JOIN order_items oi ON p.product_id = oi.product_id
  GROUP BY p.category_id, p.product_id, p.product_name
),
ranked AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY product_revenue DESC) AS rn
  FROM product_revenue
)
SELECT category_id, product_id, product_name, product_revenue
FROM ranked
WHERE rn = 1;
```

---

##### Class 8.2 — LAG and LEAD: Comparing Rows in Time

**Business context**: The CFO wants a month-over-month revenue table showing current month revenue, prior month revenue, and the change. LAG pulls in the previous row's value — making time comparisons trivial.

**After this class, the student can**:
- Use LAG(column, 1) to get the value from the previous row.
- Use LEAD(column, 1) to get the value from the next row.
- Combine LAG with ORDER BY inside OVER to create time-ordered comparisons.
- Calculate absolute and percentage change between periods.

**Challenges**:

```sql
-- Challenge 8.2.1: Month-over-month revenue comparison
-- Return each month's revenue, the prior month's revenue, and the dollar change.

WITH monthly_revenue AS (
  SELECT
    DATE_TRUNC('month', created_at) AS order_month,
    SUM(order_total)                AS monthly_revenue
  FROM orders
  GROUP BY 1
)
SELECT
  order_month,
  monthly_revenue,
  LAG(monthly_revenue) OVER (ORDER BY order_month) AS prior_month_revenue,
  monthly_revenue - LAG(monthly_revenue) OVER (ORDER BY order_month) AS revenue_change
FROM monthly_revenue
ORDER BY order_month;
```

```sql
-- Challenge 8.2.2: MoM % change
-- Extend the above to also include a pct_change column (as a percentage).
-- Use NULLIF to avoid division by zero.

WITH monthly_revenue AS (
  SELECT
    DATE_TRUNC('month', created_at) AS order_month,
    SUM(order_total)                AS monthly_revenue
  FROM orders
  GROUP BY 1
),
with_lag AS (
  SELECT
    order_month,
    monthly_revenue,
    LAG(monthly_revenue) OVER (ORDER BY order_month) AS prior_month_revenue
  FROM monthly_revenue
)
SELECT
  order_month,
  monthly_revenue,
  prior_month_revenue,
  ROUND(
    (monthly_revenue - prior_month_revenue)::numeric /
    NULLIF(prior_month_revenue, 0) * 100, 1
  ) AS pct_change
FROM with_lag
ORDER BY order_month;
```

```sql
-- Challenge 8.2.3: Days since previous order (per customer)
-- For each order, show the date of the previous order by the same customer,
-- and how many days elapsed since then.

SELECT
  order_id,
  customer_id,
  created_at,
  LAG(created_at) OVER (PARTITION BY customer_id ORDER BY created_at) AS prev_order_date,
  (created_at::date -
    LAG(created_at::date) OVER (PARTITION BY customer_id ORDER BY created_at)
  ) AS days_since_prev_order
FROM orders
ORDER BY customer_id, created_at;
```

---

##### Class 8.3 — Running Totals and Moving Averages

**Business context**: Finance wants a running total of revenue across the year. The growth team wants a 7-day moving average of daily sign-ups to smooth out weekend noise. Both are window aggregates.

**After this class, the student can**:
- Use SUM(...) OVER (ORDER BY ...) for a running total.
- Use AVG(...) OVER (ORDER BY ... ROWS BETWEEN ...) for a moving average.
- Use PARTITION BY + running total to reset per group (e.g., per customer).
- Explain the difference between a window aggregate and GROUP BY aggregate.

**Challenges**:

```sql
-- Challenge 8.3.1: Running total revenue by month
-- Return order_month, monthly_revenue, and running_total (cumulative sum up to that month).

WITH monthly AS (
  SELECT
    DATE_TRUNC('month', created_at) AS order_month,
    SUM(order_total) AS monthly_revenue
  FROM orders
  GROUP BY 1
)
SELECT
  order_month,
  monthly_revenue,
  SUM(monthly_revenue) OVER (ORDER BY order_month) AS running_total
FROM monthly
ORDER BY order_month;
```

```sql
-- Challenge 8.3.2: 3-month moving average revenue
-- Return order_month, monthly_revenue, and a 3-month moving average.

WITH monthly AS (
  SELECT
    DATE_TRUNC('month', created_at) AS order_month,
    SUM(order_total) AS monthly_revenue
  FROM orders
  GROUP BY 1
)
SELECT
  order_month,
  monthly_revenue,
  AVG(monthly_revenue) OVER (
    ORDER BY order_month
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) AS moving_avg_3mo
FROM monthly
ORDER BY order_month;
```

```sql
-- Challenge 8.3.3: Running spend per customer
-- For each order, show the customer's running total spend up to and including that order.
-- Return order_id, customer_id, created_at, order_total, running_customer_spend.

SELECT
  order_id,
  customer_id,
  created_at,
  order_total,
  SUM(order_total) OVER (
    PARTITION BY customer_id
    ORDER BY created_at
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_customer_spend
FROM orders
ORDER BY customer_id, created_at;
```

---

### LEVEL 4 — Job-Ready Toolkit

> **Goal**: Apply everything to the analytics patterns that show up in real job interviews and on the actual job. Add performance awareness and modern infrastructure context.

---

#### Module 9: Real Analytics Patterns

**Why this module exists**: This module bridges SQL skills with actual deliverables — the dashboards, reports, and ad-hoc analyses that financial, marketing, and product analysts produce every day.

**Learning Objectives**:
1. Build a funnel analysis query showing step-by-step conversion rates.
2. Build a customer retention / churn table.
3. Build a first-touch and last-touch marketing attribution query.
4. Build a P&L-style revenue summary with cost of goods and gross margin.
5. Identify patterns common to financial reporting (period-over-period, budget vs actual).
6. Read and explain a query written by someone else (SQL comprehension).

---

##### Class 9.1 — Funnel Analysis

**Business context**: Marketing runs campaigns that drive visitors to the GrooveCommerce website. Those visitors may browse sessions → view products → add to cart → complete an order. A funnel query measures how many users make it through each step.

**After this class, the student can**:
- Define a conversion funnel and each step.
- Write a funnel query using COUNT(DISTINCT) per step.
- Calculate step-to-step conversion rates.
- Explain what a "leaky" step looks like in the data.

**Challenges**:

```sql
-- Challenge 9.1.1: Basic funnel counts
-- Count: total sessions, sessions with a page_view event,
-- sessions with an add_to_cart event, sessions tied to a completed order.

SELECT
  COUNT(DISTINCT session_id)                                    AS total_sessions,
  COUNT(DISTINCT CASE WHEN event_type = 'page_view'    THEN session_id END) AS viewed_product,
  COUNT(DISTINCT CASE WHEN event_type = 'add_to_cart'  THEN session_id END) AS added_to_cart,
  COUNT(DISTINCT CASE WHEN event_type = 'purchase'     THEN session_id END) AS purchased
FROM sessions;
```

```sql
-- Challenge 9.1.2: Funnel with conversion rates
-- Extend 9.1.1 to include step-to-step conversion rates.

WITH funnel AS (
  SELECT
    COUNT(DISTINCT session_id)                                                    AS total_sessions,
    COUNT(DISTINCT CASE WHEN event_type = 'page_view'    THEN session_id END)    AS viewed_product,
    COUNT(DISTINCT CASE WHEN event_type = 'add_to_cart'  THEN session_id END)    AS added_to_cart,
    COUNT(DISTINCT CASE WHEN event_type = 'purchase'     THEN session_id END)    AS purchased
  FROM sessions
)
SELECT
  total_sessions,
  viewed_product,
  added_to_cart,
  purchased,
  ROUND(viewed_product::numeric   / NULLIF(total_sessions, 0) * 100, 1) AS view_rate,
  ROUND(added_to_cart::numeric    / NULLIF(viewed_product, 0) * 100, 1) AS cart_rate,
  ROUND(purchased::numeric        / NULLIF(added_to_cart, 0) * 100, 1)  AS purchase_rate
FROM funnel;
```

```sql
-- Challenge 9.1.3: Funnel by acquisition channel
-- Break down the funnel by customer acquisition_channel.
-- Join sessions to customers on customer_id, then calculate funnel steps per channel.

SELECT
  c.acquisition_channel,
  COUNT(DISTINCT s.session_id)                                                    AS total_sessions,
  COUNT(DISTINCT CASE WHEN s.event_type = 'page_view'   THEN s.session_id END)   AS viewed_product,
  COUNT(DISTINCT CASE WHEN s.event_type = 'add_to_cart' THEN s.session_id END)   AS added_to_cart,
  COUNT(DISTINCT CASE WHEN s.event_type = 'purchase'    THEN s.session_id END)   AS purchased
FROM sessions s
LEFT JOIN customers c ON s.customer_id = c.customer_id
GROUP BY c.acquisition_channel
ORDER BY total_sessions DESC;
```

---

##### Class 9.2 — Retention and Churn

**Business context**: The growth team needs to know: "Of customers who ordered in January 2024, how many came back and ordered in February?" This is retention. Its inverse is churn. These are the most important metrics in a subscription or repeat-purchase business.

**After this class, the student can**:
- Build a month-over-month customer retention matrix.
- Define "retained," "churned," and "reactivated" using SQL.
- Calculate a monthly retention rate.
- Explain the difference between user-level and cohort-level retention.

**Challenges**:

```sql
-- Challenge 9.2.1: Active customers per month
-- For each month, return the count of unique customers who placed an order.

SELECT
  DATE_TRUNC('month', created_at) AS order_month,
  COUNT(DISTINCT customer_id)     AS active_customers
FROM orders
WHERE status_code != 5
GROUP BY 1
ORDER BY 1;
```

```sql
-- Challenge 9.2.2: Month-over-month retention
-- For each pair of consecutive months, count customers who were active in both.
-- Return month_a, month_b (next month), retained_customers.

WITH monthly_active AS (
  SELECT
    customer_id,
    DATE_TRUNC('month', created_at) AS order_month
  FROM orders
  WHERE status_code != 5
  GROUP BY 1, 2
)
SELECT
  a.order_month          AS month_a,
  b.order_month          AS month_b,
  COUNT(DISTINCT a.customer_id) AS retained_customers
FROM monthly_active a
JOIN monthly_active b
  ON a.customer_id = b.customer_id
 AND b.order_month = a.order_month + INTERVAL '1 month'
GROUP BY 1, 2
ORDER BY 1;
```

```sql
-- Challenge 9.2.3: Customers who churned (ordered in month M, not in month M+1)
-- Return churned_month and churned_customer_count.

WITH monthly_active AS (
  SELECT
    customer_id,
    DATE_TRUNC('month', created_at) AS order_month
  FROM orders
  WHERE status_code != 5
  GROUP BY 1, 2
)
SELECT
  a.order_month                 AS churned_month,
  COUNT(DISTINCT a.customer_id) AS churned_customers
FROM monthly_active a
LEFT JOIN monthly_active b
       ON a.customer_id = b.customer_id
      AND b.order_month = a.order_month + INTERVAL '1 month'
WHERE b.customer_id IS NULL
GROUP BY 1
ORDER BY 1;
```

---

##### Class 9.3 — Revenue & P&L Style Reporting

**Business context**: As a financial analyst, you'll often be asked to produce a P&L-style breakdown: gross revenue, discounts, net revenue, and gross margin. This class builds that pattern using SQL.

**After this class, the student can**:
- Build a revenue summary with gross, discount, and net revenue.
- Incorporate unit cost data to calculate gross margin.
- Produce a period-over-period comparison for a CFO-style summary.
- Format numbers appropriately in a SELECT output.

**Challenges**:

```sql
-- Challenge 9.3.1: Monthly P&L summary
-- Return order_month, gross_revenue, total_discounts, net_revenue for each month.

SELECT
  DATE_TRUNC('month', created_at)        AS order_month,
  SUM(order_total)                       AS gross_revenue,
  SUM(COALESCE(discount_amount, 0))      AS total_discounts,
  SUM(order_total) - SUM(COALESCE(discount_amount, 0)) AS net_revenue
FROM orders
WHERE status_code != 5
GROUP BY 1
ORDER BY 1;
```

```sql
-- Challenge 9.3.2: Gross margin by product category
-- Return category_id, total_revenue, total_cost, gross_profit, gross_margin_pct.
-- Use unit_price * quantity as revenue, unit_cost * quantity as cost.

SELECT
  p.category_id,
  SUM(oi.unit_price * oi.quantity)                          AS total_revenue,
  SUM(p.unit_cost * oi.quantity)                            AS total_cost,
  SUM(oi.unit_price * oi.quantity) - SUM(p.unit_cost * oi.quantity) AS gross_profit,
  ROUND(
    (SUM(oi.unit_price * oi.quantity) - SUM(p.unit_cost * oi.quantity))::numeric /
    NULLIF(SUM(oi.unit_price * oi.quantity), 0) * 100, 1
  ) AS gross_margin_pct
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
GROUP BY p.category_id
ORDER BY gross_margin_pct DESC;
```

```sql
-- Challenge 9.3.3: YoY comparison
-- For 2023 vs 2024, show total_orders, total_revenue, and revenue_yoy_change_pct.

WITH yearly AS (
  SELECT
    EXTRACT(YEAR FROM created_at) AS order_year,
    COUNT(*)         AS total_orders,
    SUM(order_total) AS total_revenue
  FROM orders
  WHERE status_code != 5
    AND EXTRACT(YEAR FROM created_at) IN (2023, 2024)
  GROUP BY 1
)
SELECT
  order_year,
  total_orders,
  total_revenue,
  ROUND(
    (total_revenue - LAG(total_revenue) OVER (ORDER BY order_year))::numeric /
    NULLIF(LAG(total_revenue) OVER (ORDER BY order_year), 0) * 100, 1
  ) AS revenue_yoy_pct
FROM yearly
ORDER BY order_year;
```

---

#### Module 10: Performance Basics & Modern Infrastructure Deep Dive

**Why this module exists**: Writing correct SQL is necessary. Writing *efficient* SQL is professional. This module introduces the concepts — indexes, partitioning, query cost — that separate a junior analyst from a capable one, and revisits the data infrastructure landscape with the full course context now available.

**Learning Objectives**:
1. Explain what an index is conceptually and why it speeds up queries.
2. Explain what partitioning and clustering mean in a cloud warehouse context.
3. Describe what "query cost" or "bytes scanned" means in a cloud warehouse.
4. Write readable, well-formatted SQL that a colleague can review.
5. Apply the ETL/ELT → warehouse → dashboard pipeline to a complete mental model.
6. Recognize which query patterns are expensive vs cheap.

---

##### Class 10.1 — Index and Partition Concepts

**Business context**: Your query on 100 million order rows takes 4 minutes. Your colleague's identical query on the same data takes 3 seconds. The difference is whether the table is partitioned by date and whether the right column is indexed. You don't manage this — but you need to understand it.

**After this class, the student can**:
- Explain an index using a non-technical analogy (e.g., a book's index vs reading every page).
- Explain how a query on a date-partitioned table avoids scanning all historical data.
- Describe what clustering means (rows physically sorted for fast range scans).
- Write queries that take advantage of partitioned tables (always filter on the partition column).

**Challenges**:

```sql
-- Challenge 10.1.1: Partition-aware query (always filter on date)
-- In a real warehouse, orders would be partitioned by created_at.
-- Write the query for "revenue last 30 days" in a way that uses the partition.
-- (The correct pattern: always include the partition column in WHERE)

SELECT
  DATE_TRUNC('day', created_at) AS order_day,
  COUNT(*)          AS orders,
  SUM(order_total)  AS daily_revenue
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'  -- uses partition
GROUP BY 1
ORDER BY 1;
```

```sql
-- Challenge 10.1.2: Avoid SELECT * on large tables
-- Demonstrate the principle: select only the columns you need.
-- Rewrite this expensive pattern: SELECT * FROM orders ...
-- to return only order_id, customer_id, order_total, created_at.

SELECT order_id, customer_id, order_total, created_at
FROM orders
WHERE created_at >= '2024-01-01'
ORDER BY created_at DESC;
```

```sql
-- Challenge 10.1.3: Pre-aggregate in a CTE before joining
-- Joining a large table to another large table is expensive.
-- It is cheaper to aggregate one side first, then join.
-- Return customer_id and lifetime_value using an aggregated CTE before joining to customers.

WITH ltv AS (
  SELECT customer_id, SUM(order_total) AS lifetime_value
  FROM orders
  WHERE status_code != 5
  GROUP BY customer_id
)
SELECT c.customer_id, c.first_name, c.email, l.lifetime_value
FROM customers c
JOIN ltv l ON c.customer_id = l.customer_id
ORDER BY l.lifetime_value DESC
LIMIT 20;
```

---

##### Class 10.2 — Writing Good SQL: Readability and Real-World Standards

**Business context**: You'll write queries that other analysts will read, maintain, and build on. SQL that is hard to read is a liability. This class is about the habits that make you easy to work with.

**After this class, the student can**:
- Format a query with consistent indentation and line breaks.
- Write meaningful aliases for every table and column.
- Add inline comments to explain non-obvious logic.
- Explain the rule: one logical unit per CTE, meaningful names over `q1` or `temp`.

**Challenges**:

```sql
-- Challenge 10.2.1: Reformat a messy query
-- This query is correct but unreadable. Rewrite it with proper formatting.
-- Original: select c.customer_id,c.email,sum(o.order_total) as ltv from customers c join orders o on c.customer_id=o.customer_id where o.status_code!=5 group by c.customer_id,c.email order by ltv desc limit 20

SELECT
  c.customer_id,
  c.email,
  SUM(o.order_total) AS lifetime_value
FROM customers c
JOIN orders o
  ON c.customer_id = o.customer_id
WHERE o.status_code != 5  -- exclude cancelled
GROUP BY
  c.customer_id,
  c.email
ORDER BY lifetime_value DESC
LIMIT 20;
```

```sql
-- Challenge 10.2.2: Add meaningful aliases and comments
-- The following query works but uses cryptic aliases. Fix it.
-- Original (cryptic): SELECT a.x, b.y, SUM(b.z) as s FROM customers a JOIN orders b ON a.a=b.a GROUP BY a.x,b.y;

SELECT
  c.customer_id,
  c.acquisition_channel,
  SUM(o.order_total) AS total_revenue
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
GROUP BY
  c.customer_id,
  c.acquisition_channel;
```

```sql
-- Challenge 10.2.3: Structure a multi-step analysis properly
-- Build a complete, well-formatted, commented query that answers:
-- "Which acquisition channel generates the highest average lifetime value per customer?"

-- Step 1: Sum non-cancelled orders per customer
WITH customer_ltv AS (
  SELECT
    customer_id,
    SUM(order_total) AS lifetime_value
  FROM orders
  WHERE status_code != 5
  GROUP BY customer_id
),

-- Step 2: Join to customers to get acquisition channel
channel_ltv AS (
  SELECT
    c.acquisition_channel,
    l.lifetime_value
  FROM customers c
  JOIN customer_ltv l ON c.customer_id = l.customer_id
)

-- Step 3: Average LTV per channel
SELECT
  acquisition_channel,
  COUNT(*)             AS customer_count,
  ROUND(AVG(lifetime_value)::numeric, 2) AS avg_lifetime_value
FROM channel_ltv
GROUP BY acquisition_channel
ORDER BY avg_lifetime_value DESC;
```

---

#### ✅ Final Checkpoint — Job-Ready Assessment

**Purpose**: Full integration of all course skills in a realistic business scenario. These challenges mirror what you'll see in technical interviews and on the first week of a job.

**Final Checkpoint Challenges**:

```sql
-- Final 1: Full funnel + channel breakdown
-- For each acquisition channel, return:
-- total_customers, customers_who_ordered, conversion_rate, avg_lifetime_value.
-- This is a classic Marketing Analyst interview question.

WITH customer_orders AS (
  SELECT
    customer_id,
    COUNT(*) AS order_count,
    SUM(order_total) AS total_spend
  FROM orders
  WHERE status_code != 5
  GROUP BY customer_id
)
SELECT
  c.acquisition_channel,
  COUNT(DISTINCT c.customer_id)         AS total_customers,
  COUNT(DISTINCT co.customer_id)        AS customers_who_ordered,
  ROUND(
    COUNT(DISTINCT co.customer_id)::numeric /
    NULLIF(COUNT(DISTINCT c.customer_id), 0) * 100, 1
  )                                     AS conversion_rate_pct,
  ROUND(AVG(co.total_spend)::numeric, 2) AS avg_lifetime_value
FROM customers c
LEFT JOIN customer_orders co ON c.customer_id = co.customer_id
GROUP BY c.acquisition_channel
ORDER BY avg_lifetime_value DESC;
```

```sql
-- Final 2: Monthly revenue dashboard query
-- Return for each month: order_month, order_count, gross_revenue, avg_order_value,
-- MoM revenue change ($), MoM revenue change (%), and running year-to-date revenue.

WITH monthly AS (
  SELECT
    DATE_TRUNC('month', created_at) AS order_month,
    COUNT(*)                        AS order_count,
    SUM(order_total)                AS gross_revenue
  FROM orders
  WHERE status_code != 5
  GROUP BY 1
)
SELECT
  order_month,
  order_count,
  gross_revenue,
  ROUND((gross_revenue / order_count)::numeric, 2)   AS avg_order_value,
  gross_revenue
    - LAG(gross_revenue) OVER (ORDER BY order_month)   AS mom_revenue_change,
  ROUND(
    (gross_revenue - LAG(gross_revenue) OVER (ORDER BY order_month))::numeric /
    NULLIF(LAG(gross_revenue) OVER (ORDER BY order_month), 0) * 100, 1
  )                                                    AS mom_pct_change,
  SUM(gross_revenue) OVER (
    PARTITION BY DATE_TRUNC('year', order_month)
    ORDER BY order_month
  )                                                    AS ytd_revenue
FROM monthly
ORDER BY order_month;
```

```sql
-- Final 3: Complete data quality audit
-- Run a health check on the orders table. Return:
-- total_orders, pct_cancelled, pct_no_delivery_date, pct_duplicate_order_id,
-- oldest_order, newest_order.

SELECT
  COUNT(*)                                    AS total_orders,
  ROUND(100.0 * SUM(CASE WHEN status_code = 5 THEN 1 ELSE 0 END) / COUNT(*), 1)
                                              AS pct_cancelled,
  ROUND(100.0 * SUM(CASE WHEN delivery_date IS NULL THEN 1 ELSE 0 END) / COUNT(*), 1)
                                              AS pct_no_delivery_date,
  COUNT(*) - COUNT(DISTINCT order_id)         AS duplicate_order_ids,
  MIN(created_at)                             AS oldest_order,
  MAX(created_at)                             AS newest_order
FROM orders;
```

---

## Practice Database Schema

**Domain**: GrooveCommerce — an e-commerce platform where customers browse, add to cart, and purchase physical products. The company also runs marketing campaigns and tracks web sessions.

**Why this domain?** It supports all three target roles simultaneously:
- **Financial Analyst**: Revenue, refunds, discount analysis, P&L metrics, period comparisons.
- **Marketing Analyst**: Campaign performance, funnel analysis, channel attribution, cohorts.
- **Junior Data Analyst**: Cross-table joins, data quality, aggregations, window functions.

---

### Table Definitions

---

#### `customers`
Stores one row per registered customer.

| Column | Type | Notes |
|---|---|---|
| `customer_id` | INTEGER | **Primary Key** |
| `first_name` | VARCHAR | — |
| `last_name` | VARCHAR | — |
| `email` | VARCHAR | Unique, nullable (some records may be incomplete) |
| `phone` | VARCHAR | Nullable |
| `created_at` | TIMESTAMP | When the customer registered |
| `acquisition_channel` | VARCHAR | e.g., 'organic_search', 'paid_social', 'referral', 'email', NULL |
| `country` | VARCHAR | e.g., 'US', 'BR', 'UK' |

**Example rows**:
| customer_id | first_name | last_name | email | phone | created_at | acquisition_channel | country |
|---|---|---|---|---|---|---|---|
| 1 | Ana | Souza | ana@gmail.com | NULL | 2024-01-05 09:12:00 | paid_social | BR |
| 2 | John | Smith | john@yahoo.com | +1-555-0100 | 2024-01-06 14:30:00 | organic_search | US |
| 3 | Maria | Lopez | NULL | +55-11-9000 | 2024-01-07 11:00:00 | referral | BR |

---

#### `orders`
One row per order placed.

| Column | Type | Notes |
|---|---|---|
| `order_id` | INTEGER | **Primary Key** |
| `customer_id` | INTEGER | **FK → customers.customer_id** |
| `created_at` | TIMESTAMP | Order placement time |
| `status_code` | INTEGER | 1=pending, 2=confirmed, 3=shipped, 4=delivered, 5=cancelled |
| `order_total` | DECIMAL | Sum of all items (before discount applied at checkout) |
| `discount_amount` | DECIMAL | Nullable — discount applied to the order |
| `delivery_date` | DATE | Nullable — filled when delivered |
| `shipping_address_country` | VARCHAR | Destination country |

**Example rows**:
| order_id | customer_id | created_at | status_code | order_total | discount_amount | delivery_date |
|---|---|---|---|---|---|---|
| 1001 | 1 | 2024-01-10 10:05:00 | 4 | 149.99 | NULL | 2024-01-14 |
| 1002 | 2 | 2024-01-11 08:20:00 | 4 | 59.50 | 5.00 | 2024-01-15 |
| 1003 | 1 | 2024-02-01 16:45:00 | 3 | 299.00 | NULL | NULL |
| 1004 | 3 | 2024-02-03 09:00:00 | 5 | 89.99 | NULL | NULL |

---

#### `order_items`
One row per product line within an order. An order with 3 different products = 3 rows.

| Column | Type | Notes |
|---|---|---|
| `order_item_id` | INTEGER | **Primary Key** |
| `order_id` | INTEGER | **FK → orders.order_id** |
| `product_id` | INTEGER | **FK → products.product_id** |
| `quantity` | INTEGER | Units ordered |
| `unit_price` | DECIMAL | Price at time of purchase (may differ from current catalog price) |

**Example rows**:
| order_item_id | order_id | product_id | quantity | unit_price |
|---|---|---|---|---|
| 1 | 1001 | 201 | 1 | 99.99 |
| 2 | 1001 | 305 | 2 | 25.00 |
| 3 | 1002 | 201 | 1 | 59.50 |

---

#### `products`
Catalog of all products available on the platform.

| Column | Type | Notes |
|---|---|---|
| `product_id` | INTEGER | **Primary Key** |
| `product_name` | VARCHAR | — |
| `category_id` | INTEGER | **FK → product_categories.category_id** |
| `price` | DECIMAL | Current catalog price |
| `unit_cost` | DECIMAL | Cost of goods (for margin calculations) |
| `is_active` | BOOLEAN | Whether the product is currently listed |
| `created_at` | TIMESTAMP | When it was added to the catalog |

**Example rows**:
| product_id | product_name | category_id | price | unit_cost | is_active |
|---|---|---|---|---|---|
| 201 | Wireless Pro Headphones | 10 | 99.99 | 42.00 | TRUE |
| 202 | USB-C Charging Cable | 11 | 12.99 | 2.50 | TRUE |
| 305 | Cotton T-Shirt (M) | 20 | 25.00 | 8.00 | TRUE |
| 306 | Running Shorts | 20 | 35.00 | 11.00 | FALSE |

---

#### `product_categories`
Lookup table mapping category IDs to names.

| Column | Type | Notes |
|---|---|---|
| `category_id` | INTEGER | **Primary Key** |
| `category_name` | VARCHAR | — |
| `parent_category_id` | INTEGER | Nullable — for subcategory hierarchy |

**Example rows**:
| category_id | category_name | parent_category_id |
|---|---|---|
| 10 | Electronics | NULL |
| 11 | Accessories | 10 |
| 20 | Apparel | NULL |

---

#### `marketing_campaigns`
One row per marketing campaign run by the team.

| Column | Type | Notes |
|---|---|---|
| `campaign_id` | INTEGER | **Primary Key** |
| `campaign_name` | VARCHAR | — |
| `channel` | VARCHAR | e.g., 'paid_search', 'paid_social', 'email', 'influencer' |
| `start_date` | DATE | — |
| `end_date` | DATE | — |
| `budget` | DECIMAL | Total allocated budget |
| `clicks` | INTEGER | Total clicks (may also come from campaign_events) |
| `conversions` | INTEGER | Total attributed conversions |

**Example rows**:
| campaign_id | campaign_name | channel | start_date | end_date | budget | clicks | conversions |
|---|---|---|---|---|---|---|---|
| 1 | Jan2024_PaidSearch | paid_search | 2024-01-01 | 2024-01-31 | 5000.00 | 12400 | 310 |
| 2 | Feb2024_Instagram | paid_social | 2024-02-01 | 2024-02-28 | 3000.00 | 8800 | 176 |
| 3 | Spring_Email_Blast | email | 2024-03-01 | 2024-03-31 | 500.00 | 4200 | 189 |

---

#### `campaign_events`
Event-level data: one row per campaign interaction (click, impression, conversion). This is the "raw" equivalent of what would live in a data lake before aggregation.

| Column | Type | Notes |
|---|---|---|
| `event_id` | INTEGER | **Primary Key** |
| `campaign_id` | INTEGER | **FK → marketing_campaigns.campaign_id** |
| `customer_id` | INTEGER | **FK → customers.customer_id** — nullable (anonymous visitors) |
| `event_type` | VARCHAR | 'impression', 'click', 'conversion' |
| `event_at` | TIMESTAMP | When the event occurred |

**Example rows**:
| event_id | campaign_id | customer_id | event_type | event_at |
|---|---|---|---|---|
| 1 | 1 | NULL | impression | 2024-01-05 10:00:00 |
| 2 | 1 | 1 | click | 2024-01-05 10:01:30 |
| 3 | 1 | 1 | conversion | 2024-01-05 10:05:00 |
| 4 | 2 | 2 | click | 2024-02-03 14:22:00 |

---

#### `sessions`
Web session-level data: one row per session event (page view, add to cart, purchase). Simulates what would be collected by a web analytics tool and loaded into the warehouse.

| Column | Type | Notes |
|---|---|---|
| `session_id` | VARCHAR | **Primary Key** (typically a UUID) |
| `customer_id` | INTEGER | **FK → customers.customer_id** — nullable (anonymous) |
| `event_type` | VARCHAR | 'page_view', 'add_to_cart', 'purchase' |
| `page` | VARCHAR | URL path, e.g., '/products/201' |
| `event_at` | TIMESTAMP | When the event occurred |
| `device_type` | VARCHAR | 'mobile', 'desktop', 'tablet' |

**Example rows**:
| session_id | customer_id | event_type | page | event_at | device_type |
|---|---|---|---|---|---|
| sess_abc1 | 1 | page_view | /products/201 | 2024-01-10 10:00:00 | mobile |
| sess_abc1 | 1 | add_to_cart | /cart | 2024-01-10 10:02:00 | mobile |
| sess_abc1 | 1 | purchase | /checkout/confirm | 2024-01-10 10:05:00 | mobile |
| sess_def2 | NULL | page_view | /products/305 | 2024-01-10 11:30:00 | desktop |

---

#### `refunds`
One row per refund issued on an order or order item.

| Column | Type | Notes |
|---|---|---|
| `refund_id` | INTEGER | **Primary Key** |
| `order_id` | INTEGER | **FK → orders.order_id** |
| `order_item_id` | INTEGER | **FK → order_items.order_item_id** — nullable (whole-order refund) |
| `refund_amount` | DECIMAL | — |
| `refund_reason` | VARCHAR | e.g., 'defective', 'wrong_item', 'customer_changed_mind' |
| `refunded_at` | TIMESTAMP | — |

**Example rows**:
| refund_id | order_id | order_item_id | refund_amount | refund_reason | refunded_at |
|---|---|---|---|---|---|
| 1 | 1002 | 3 | 59.50 | defective | 2024-01-20 09:00:00 |
| 2 | 1005 | NULL | 149.99 | customer_changed_mind | 2024-02-15 14:00:00 |

---

### Entity-Relationship Summary

```
customers (1) ──────────────────── (N) orders
orders (1) ──────────────────────── (N) order_items
products (1) ────────────────────── (N) order_items
product_categories (1) ──────────── (N) products
orders (1) ──────────────────────── (N) refunds
order_items (1) ─────────────────── (N) refunds
marketing_campaigns (1) ─────────── (N) campaign_events
customers (1) ──────────────────── (N) campaign_events [nullable]
customers (1) ──────────────────── (N) sessions [nullable]
```

---

## Notes on Progression & Teaching Strategy

### Difficulty Levels

| Level | Modules | Description |
|---|---|---|
| **Foundations** | 1–2 + Checkpoint A | Conceptual orientation, first SELECT queries, filtering |
| **Core Analytics SQL** | 3–4 + Checkpoint B | Aggregation, GROUP BY, HAVING, INNER/LEFT JOINs |
| **Intermediate** | 5–8 + Checkpoint C | Dates, CASE WHEN, data quality, CTEs, window functions |
| **Job-Ready Toolkit** | 9–10 + Final Checkpoint | Analytics patterns (funnels, retention, P&L), performance, style |

### Pedagogical Principles

**Concrete before abstract.** Every concept is introduced through a GrooveCommerce business scenario before the syntax is explained. Students need to understand *why* they're writing the query before they care about *how*.

**Mistakes are curriculum.** Each "⚠️ Common Mistake Callout" box is as important as the lesson itself. The most damaging SQL bugs — NULL comparisons, GROUP BY violations, fan-out joins, WHERE on aggregates — are introduced where students are most likely to make them.

**One schema, total fluency.** Using GrooveCommerce throughout the entire course means students develop genuine comfort with the tables. By Module 9, a student can look at a business question and immediately know which tables they need — a key signal of job-readiness.

**CTEs are not advanced.** Despite being placed in Level 3, CTEs should be normalized early via previews. The fan-out join solution in Module 4 already introduces a CTE. Students will adopt good habits sooner if they see the CTE style before they've built a habit of writing nested subqueries.

**Window functions are not optional.** Every technical SQL interview for analyst roles includes at least one window function question. ROW_NUMBER, LAG, and SUM OVER are now considered core skills, not advanced ones. Module 8 makes this explicit.

**Infrastructure context matters more than it seems.** The most common reason a junior analyst appears unqualified in an interview is not lack of SQL — it's lack of context. They can't explain what a data warehouse is, don't know what ETL means, and haven't heard of dbt. Module 1 fixes this directly.

### Common Mistake Callouts — Master List

These appear in the relevant lessons but are summarized here for instructor reference:

- `WHERE column = NULL` → always returns 0 rows. Use `IS NULL`. *(Class 2.5)*
- AND evaluates before OR without parentheses. *(Class 2.2)*
- `EXTRACT(month ...)` without year merges January 2023 + January 2024. Use `DATE_TRUNC`. *(Class 5.1)*
- `COUNT(column)` ignores NULLs; `COUNT(*)` does not. *(Class 3.1)*
- Every non-aggregated SELECT column must be in GROUP BY. *(Class 3.2)*
- `WHERE SUM(...)` throws an error — use HAVING. *(Class 3.3)*
- INNER JOIN silently drops unmatched rows. *(Class 4.1)*
- LEFT JOIN + WHERE on right table = accidental INNER JOIN. *(Class 4.2)*
- Fan-out joins inflate aggregations. Aggregate first, then join. *(Class 4.3)*
- ROW_NUMBER vs RANK vs DENSE_RANK handle ties differently. *(Class 8.1)*
- `SUM(a) / SUM(b)` crashes on division by zero. Use `NULLIF(SUM(b), 0)`. *(Class 6.2)*

### Target Role Alignment

| Topic | Financial Analyst | Marketing Analyst | Junior Data Analyst |
|---|---|---|---|
| SELECT, WHERE, ORDER BY | ✅ Daily | ✅ Daily | ✅ Daily |
| GROUP BY + HAVING | ✅ Core | ✅ Core | ✅ Core |
| INNER + LEFT JOIN | ✅ Core | ✅ Core | ✅ Core |
| Date functions + cohorts | ✅ Period comp. | ✅ Cohorts | ✅ All |
| CASE WHEN + COALESCE | ✅ Labeling | ✅ Segmentation | ✅ All |
| Data quality checks | ✅ Reconciliation | ✅ List hygiene | ✅ Core |
| CTEs | ✅ Readability | ✅ Readability | ✅ Essential |
| Window functions | ✅ Running totals | ✅ Rankings | ✅ Essential |
| Funnel + retention | ➖ Light | ✅ Core | ✅ Core |
| P&L + margin analysis | ✅ Core | ➖ Light | ✅ Core |
| OLTP/OLAP/ETL/ELT | ✅ Context | ✅ Context | ✅ Context |
| Cloud infrastructure | ✅ Context | ✅ Context | ✅ Context |
| Performance basics | ➖ Awareness | ➖ Awareness | ✅ Core |
