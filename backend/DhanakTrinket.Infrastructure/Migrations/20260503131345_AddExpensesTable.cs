using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DhanakTrinket.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExpensesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            if (migrationBuilder.ActiveProvider == "Microsoft.EntityFrameworkCore.SqlServer")
            {
                migrationBuilder.Sql(@"
                    CREATE TABLE [Expenses] (
                        [Id] int NOT NULL IDENTITY(1,1),
                        [ExpenseDate] datetime2 NOT NULL,
                        [Description] nvarchar(1000) NOT NULL,
                        [Amount] decimal(10,2) NOT NULL,
                        [Category] int NOT NULL,
                        [VendorName] nvarchar(255) NULL,
                        [BillImagePath] nvarchar(500) NULL,
                        [Notes] nvarchar(1000) NULL,
                        [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
                        CONSTRAINT [PK_Expenses] PRIMARY KEY ([Id])
                    );
                    CREATE INDEX [IX_Expenses_Category] ON [Expenses] ([Category]);
                    CREATE INDEX [IX_Expenses_ExpenseDate] ON [Expenses] ([ExpenseDate]);
                ");
            }
            else
            {
                // SQLite (local development)
                migrationBuilder.CreateTable(
                    name: "Expenses",
                    columns: table => new
                    {
                        Id = table.Column<int>(nullable: false)
                            .Annotation("Sqlite:Autoincrement", true),
                        ExpenseDate = table.Column<DateTime>(nullable: false),
                        Description = table.Column<string>(maxLength: 1000, nullable: false),
                        Amount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                        Category = table.Column<int>(nullable: false),
                        VendorName = table.Column<string>(maxLength: 255, nullable: true),
                        BillImagePath = table.Column<string>(maxLength: 500, nullable: true),
                        Notes = table.Column<string>(maxLength: 1000, nullable: true),
                        CreatedAt = table.Column<DateTime>(nullable: false, defaultValueSql: "datetime('now')")
                    },
                    constraints: table =>
                    {
                        table.PrimaryKey("PK_Expenses", x => x.Id);
                    });

                migrationBuilder.CreateIndex(
                    name: "IX_Expenses_Category",
                    table: "Expenses",
                    column: "Category");

                migrationBuilder.CreateIndex(
                    name: "IX_Expenses_ExpenseDate",
                    table: "Expenses",
                    column: "ExpenseDate");
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Expenses");
        }
    }
}
