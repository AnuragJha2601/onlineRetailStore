using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DhanakTrinket.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameThumbnailBlobPathToUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            if (migrationBuilder.ActiveProvider == "Microsoft.EntityFrameworkCore.SqlServer")
            {
                // SQL Server rename via sp_rename
                migrationBuilder.Sql(
                    "EXEC sp_rename 'dbo.ProductImages.ThumbnailBlobPath', 'ThumbnailUrl', 'COLUMN';");
            }
            else
            {
                // SQLite 3.25+ supports RENAME COLUMN
                migrationBuilder.Sql(
                    "ALTER TABLE \"ProductImages\" RENAME COLUMN \"ThumbnailBlobPath\" TO \"ThumbnailUrl\";");
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            if (migrationBuilder.ActiveProvider == "Microsoft.EntityFrameworkCore.SqlServer")
            {
                migrationBuilder.Sql(
                    "EXEC sp_rename 'dbo.ProductImages.ThumbnailUrl', 'ThumbnailBlobPath', 'COLUMN';");
            }
            else
            {
                migrationBuilder.Sql(
                    "ALTER TABLE \"ProductImages\" RENAME COLUMN \"ThumbnailUrl\" TO \"ThumbnailBlobPath\";");
            }
        }
    }
}
