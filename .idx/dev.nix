{ pkgs, ... }: {
  channel = "stable-23.11";
  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.pnpm
  ];
  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
        ];
        manager = "web";
        env = {
          PORT = "$PORT";
        };
      };
    };
  };
  idx.extensions = [
    "prisma.prisma"
    "esbenp.prettier-vscode"
    "dbaeumer.vscode-eslint"
  ];
  idx.workspace.onCreate = {
    install = "npm run install:all";
  };
}
