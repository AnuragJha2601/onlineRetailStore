using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DhanakTrinket.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddThumbnailBlobPath : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            if (migrationBuilder.ActiveProvider == "Microsoft.EntityFrameworkCore.SqlServer")
            {
                migrationBuilder.Sql("ALTER TABLE [ProductImages] ADD [ThumbnailBlobPath] nvarchar(500) NULL;");
            }
            else
            {
                migrationBuilder.AddColumn<string>(
                    name: "ThumbnailBlobPath",
                    table: "ProductImages",
                    type: "TEXT",
                    maxLength: 500,
                    nullable: true);
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ThumbnailBlobPath",
                table: "ProductImages");
        }
    }
}
