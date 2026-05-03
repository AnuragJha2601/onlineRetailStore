-- ============================================================
--  Dhanak Trinket — Clean all business data
--  Run in Azure Portal → SQL Database → Query editor
--  Leaves schema and __EFMigrationsHistory intact.
-- ============================================================

-- 1. Delete in FK-safe order
DELETE FROM [dbo].[BulkSaleItems];
DELETE FROM [dbo].[Sales];
DELETE FROM [dbo].[Expenses];
DELETE FROM [dbo].[ProductImages];
DELETE FROM [dbo].[Products];

-- 2. Reset identity seeds so IDs start from 1 again
DBCC CHECKIDENT ('[BulkSaleItems]',  RESEED, 0);
DBCC CHECKIDENT ('[Sales]',          RESEED, 0);
DBCC CHECKIDENT ('[Expenses]',       RESEED, 0);
DBCC CHECKIDENT ('[ProductImages]',  RESEED, 0);
DBCC CHECKIDENT ('[Products]',       RESEED, 0);

-- 3. Verify — all should show 0
SELECT 'Products'       AS [Table], COUNT(*) AS Rows FROM [dbo].[Products]
UNION ALL
SELECT 'ProductImages',              COUNT(*) FROM [dbo].[ProductImages]
UNION ALL
SELECT 'Sales',                      COUNT(*) FROM [dbo].[Sales]
UNION ALL
SELECT 'BulkSaleItems',              COUNT(*) FROM [dbo].[BulkSaleItems]
UNION ALL
SELECT 'Expenses',                   COUNT(*) FROM [dbo].[Expenses];
