using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DhanakTrinket.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDynamicCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Create Categories table first (FK target)
            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1")
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Name",
                table: "Categories",
                column: "Name",
                unique: true);

            // 2. Seed existing categories so Product.Category int values become valid FKs
            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "Name", "CreatedAt" },
                values: new object[,]
                {
                    { 1,  "Bangles",          new DateTime(2026, 5, 26, 0, 0, 0, DateTimeKind.Utc) },
                    { 2,  "Necklaces",        new DateTime(2026, 5, 26, 0, 0, 0, DateTimeKind.Utc) },
                    { 3,  "Earrings",         new DateTime(2026, 5, 26, 0, 0, 0, DateTimeKind.Utc) },
                    { 4,  "Bracelets",        new DateTime(2026, 5, 26, 0, 0, 0, DateTimeKind.Utc) },
                    { 5,  "Rings",            new DateTime(2026, 5, 26, 0, 0, 0, DateTimeKind.Utc) },
                    { 6,  "Jewelry Sets",     new DateTime(2026, 5, 26, 0, 0, 0, DateTimeKind.Utc) },
                    { 7,  "Anklets",          new DateTime(2026, 5, 26, 0, 0, 0, DateTimeKind.Utc) },
                    { 8,  "Hair Accessories", new DateTime(2026, 5, 26, 0, 0, 0, DateTimeKind.Utc) },
                    { 9,  "Pendants",         new DateTime(2026, 5, 26, 0, 0, 0, DateTimeKind.Utc) },
                    { 10, "Chains",           new DateTime(2026, 5, 26, 0, 0, 0, DateTimeKind.Utc) },
                });

            // 3. Rename Product.Category → Product.CategoryId (column was already int)
            migrationBuilder.RenameColumn(
                name: "Category",
                table: "Products",
                newName: "CategoryId");

            migrationBuilder.RenameIndex(
                name: "IX_Products_Category",
                table: "Products",
                newName: "IX_Products_CategoryId");

            // 4. Add FK from Products.CategoryId → Categories.Id
            migrationBuilder.AddForeignKey(
                name: "FK_Products_Categories_CategoryId",
                table: "Products",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // 5. Add SubCategoryId to Products
            migrationBuilder.AddColumn<int>(
                name: "SubCategoryId",
                table: "Products",
                nullable: true);

            // 6. Create SubCategories table
            migrationBuilder.CreateTable(
                name: "SubCategories",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1")
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(maxLength: 100, nullable: false),
                    CategoryId = table.Column<int>(nullable: false),
                    CreatedAt = table.Column<DateTime>(nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SubCategories_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Products_SubCategoryId",
                table: "Products",
                column: "SubCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_SubCategories_CategoryId",
                table: "SubCategories",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_SubCategories_CategoryId_Name",
                table: "SubCategories",
                columns: new[] { "CategoryId", "Name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Products_SubCategories_SubCategoryId",
                table: "Products",
                column: "SubCategoryId",
                principalTable: "SubCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_Categories_CategoryId",
                table: "Products");

            migrationBuilder.DropForeignKey(
                name: "FK_Products_SubCategories_SubCategoryId",
                table: "Products");

            migrationBuilder.DropTable(
                name: "SubCategories");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropIndex(
                name: "IX_Products_SubCategoryId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "SubCategoryId",
                table: "Products");

            migrationBuilder.RenameColumn(
                name: "CategoryId",
                table: "Products",
                newName: "Category");

            migrationBuilder.RenameIndex(
                name: "IX_Products_CategoryId",
                table: "Products",
                newName: "IX_Products_Category");
        }
    }
}
