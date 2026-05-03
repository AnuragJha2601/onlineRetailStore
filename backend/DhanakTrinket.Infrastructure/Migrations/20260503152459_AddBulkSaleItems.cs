using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DhanakTrinket.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBulkSaleItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            if (migrationBuilder.ActiveProvider == "Microsoft.EntityFrameworkCore.SqlServer")
            {
                migrationBuilder.Sql(@"
                    CREATE TABLE [BulkSaleItems] (
                        [Id]          int            NOT NULL IDENTITY,
                        [SaleId]      int            NOT NULL,
                        [Description] nvarchar(500)  NOT NULL,
                        [Quantity]    int            NOT NULL,
                        [UnitPrice]   decimal(10,2)  NOT NULL,
                        [TotalPrice]  decimal(10,2)  NOT NULL,
                        CONSTRAINT [PK_BulkSaleItems] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_BulkSaleItems_Sales_SaleId]
                            FOREIGN KEY ([SaleId]) REFERENCES [Sales] ([Id]) ON DELETE CASCADE
                    );
                    CREATE INDEX [IX_BulkSaleItems_SaleId] ON [BulkSaleItems] ([SaleId]);
                ");
            }
            else
            {
                migrationBuilder.CreateTable(
                    name: "BulkSaleItems",
                    columns: table => new
                    {
                        Id = table.Column<int>(type: "INTEGER", nullable: false)
                            .Annotation("Sqlite:Autoincrement", true),
                        SaleId = table.Column<int>(type: "INTEGER", nullable: false),
                        Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                        Quantity = table.Column<int>(type: "INTEGER", nullable: false),
                        UnitPrice = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                        TotalPrice = table.Column<decimal>(type: "decimal(10,2)", nullable: false)
                    },
                    constraints: table =>
                    {
                        table.PrimaryKey("PK_BulkSaleItems", x => x.Id);
                        table.ForeignKey(
                            name: "FK_BulkSaleItems_Sales_SaleId",
                            column: x => x.SaleId,
                            principalTable: "Sales",
                            principalColumn: "Id",
                            onDelete: ReferentialAction.Cascade);
                    });

                migrationBuilder.CreateIndex(
                    name: "IX_BulkSaleItems_SaleId",
                    table: "BulkSaleItems",
                    column: "SaleId");
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BulkSaleItems");
        }
    }
}
