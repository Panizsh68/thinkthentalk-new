{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
    pkgs.pnpm
    pkgs.python3
  ];
  env = { };
  idx = {
    extensions = [
      "Prisma.prisma"
      "bradlc.vscode-tailwindcss"
    ];
    workspace = {
      onCreate = {
        install = "pnpm install && cd backend && pnpm install && cd ../frontend && pnpm install";
        prisma-generate = "cd backend && pnpm prisma generate";
      };
      onStart = {
        # Ensure database is synced and Prisma is ready
        prisma-db-push = "cd backend && pnpm prisma db push";
      };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          command = [ "pnpm" "run" "dev" ];
          manager = "web";
          env = {
            PORT = "$PORT";
          };
        };
      };
    };
  };
}
