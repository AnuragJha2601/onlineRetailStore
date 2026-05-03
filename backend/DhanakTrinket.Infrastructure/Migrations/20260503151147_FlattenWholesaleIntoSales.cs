using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DhanakTrinket.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FlattenWholesaleIntoSales : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            if (migrationBuilder.ActiveProvider == "Microsoft.EntityFrameworkCore.SqlServer")
            {
                // Azure SQL: drop FK, index, column, then the table; add new columns
                migrationBuilder.Sql("ALTER TABLE [Sales] DROP CONSTRAINT IF EXISTS [FK_Sales_WholesaleDeals_WholesaleDealId];");
                migrationBuilder.Sql("DROP INDEX IF EXISTS [IX_Sales_WholesaleDealId] ON [Sales];");
                migrationBuilder.Sql("ALTER TABLE [Sales] DROP COLUMN IF EXISTS [WholesaleDealId];");
                migrationBuilder.Sql("DROP TABLE IF EXISTS [WholesaleDeals];");
                migrationBuilder.Sql("ALTER TABLE [Sales] ADD [BuyerName]  nvarchar(255)  NULL;");
                migrationBuilder.Sql("ALTER TABLE [Sales] ADD [BuyerPhone] nvarchar(20)   NULL;");
                // Widen Notes from 500 to 1000 characters
                migrationBuilder.Sql("ALTER TABLE [Sales] ALTER COLUMN [Notes] nvarchar(1000) NULL;");
            }
            else
            {
                // SQLite path (local dev)
                migrationBuilder.DropForeignKey(
                    name: "FK_Sales_WholesaleDeals_WholesaleDealId",
                    table: "Sales");

                migrationBuilder.DropTable(
                    name: "WholesaleDeals");

                migrationBuilder.DropIndex(
                    name: "IX_Sales_WholesaleDealId",
                    table: "Sales");

                migrationBuilder.DropColumn(
                    name: "WholesaleDealId",
                    table: "Sales");

                migrationBuilder.AddColumn<string>(
                    name: "BuyerName",
                    table: "Sales",
                    type: "TEXT",
                    maxLength: 255,
                    nullable: true);

                migrationBuilder.AddColumn<string>(
                    name: "BuyerPhone",
                    table: "Sales",
                    type: "TEXT",
                    maxLength: 20,
                    nullable: true);
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BuyerName",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "BuyerPhone",
                table: "Sales");

            migrationBuilder.AddColumn<int>(
                name: "WholesaleDealId",
                table: "Sales",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "WholesaleDeals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    BuyerName = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    BuyerPhone = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    DealDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    TotalAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WholesaleDeals", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Sales_WholesaleDealId",
                table: "Sales",
                column: "WholesaleDealId");

            migrationBuilder.CreateIndex(
                name: "IX_WholesaleDeals_DealDate",
                table: "WholesaleDeals",
                column: "DealDate");

            migrationBuilder.AddForeignKey(
                name: "FK_Sales_WholesaleDeals_WholesaleDealId",
                table: "Sales",
                column: "WholesaleDealId",
                principalTable: "WholesaleDeals",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
