using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DhanakTrinket.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSubCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // No-op: all schema changes are applied by the subsequent
            // AddDynamicCategories migration which handles Categories,
            // SubCategories, and the Category→CategoryId rename together.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No-op: see Up()
        }
    }
}
