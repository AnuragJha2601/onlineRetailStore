using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using DhanakTrinket.Core.Interfaces;

namespace DhanakTrinket.Infrastructure.Services;

public class BlobStorageService : IBlobStorageService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly string _defaultContainer = "product-images";

    public BlobStorageService(BlobServiceClient blobServiceClient)
    {
        _blobServiceClient = blobServiceClient;
    }

    public async Task<string> UploadImageAsync(Stream imageStream, string fileName, string containerName = "product-images")
    {
        try
        {
            // Get container client
            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);

            // Ensure container exists
            await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

            // Generate unique filename
            var fileExtension = Path.GetExtension(fileName);
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var blobPath = $"products/{DateTime.UtcNow:yyyy/MM/dd}/{uniqueFileName}";

            // Get blob client
            var blobClient = containerClient.GetBlobClient(blobPath);

            // Set content type based on file extension
            var contentType = GetContentType(fileExtension);
            var blobHttpHeaders = new BlobHttpHeaders { ContentType = contentType };

            // Upload image
            await blobClient.UploadAsync(imageStream, overwrite: true);

            // Set content type
            await blobClient.SetHttpHeadersAsync(blobHttpHeaders);

            return blobPath;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to upload image: {ex.Message}", ex);
        }
    }

    public async Task DeleteImageAsync(string blobPath)
    {
        try
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_defaultContainer);
            var blobClient = containerClient.GetBlobClient(blobPath);

            await blobClient.DeleteIfExistsAsync();
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to delete image: {ex.Message}", ex);
        }
    }

    public async Task<string> GetImageUrlAsync(string blobPath)
    {
        try
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_defaultContainer);
            var blobClient = containerClient.GetBlobClient(blobPath);

            // Check if blob exists
            var exists = await blobClient.ExistsAsync();
            if (!exists)
            {
                throw new FileNotFoundException($"Image not found: {blobPath}");
            }

            return blobClient.Uri.ToString();
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to get image URL: {ex.Message}", ex);
        }
    }

    private static string GetContentType(string fileExtension)
    {
        return fileExtension.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".bmp" => "image/bmp",
            ".svg" => "image/svg+xml",
            _ => "application/octet-stream"
        };
    }
}