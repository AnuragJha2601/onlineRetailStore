#!/usr/bin/env dotnet-script
// Usage: dotnet script generate-password-hash.csx
// Or:    dotnet script generate-password-hash.csx -- myNewPassword
//
// Requires: dotnet-script  →  dotnet tool install -g dotnet-script

#r "nuget: BCrypt.Net-Next, 4.0.3"
using BCrypt.Net;

string password;

if (Args.Count > 0)
{
    password = Args[0];
}
else
{
    Console.Write("Enter new admin password: ");
    password = Console.ReadLine() ?? "";
}

if (string.IsNullOrWhiteSpace(password))
{
    Console.Error.WriteLine("Password cannot be empty.");
    return;
}

string hash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);

Console.WriteLine();
Console.WriteLine("Password hash generated successfully.");
Console.WriteLine();
Console.WriteLine("Set this as the Azure App Service environment variable:");
Console.WriteLine("  Name:  AdminAuth__PasswordHash");
Console.WriteLine($"  Value: {hash}");
Console.WriteLine();
Console.WriteLine("For local dev, paste into appsettings.Development.json:");
Console.WriteLine($"  \"PasswordHash\": \"{hash}\"");
