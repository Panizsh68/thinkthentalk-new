{ pkgs, ... }:
{
  channel = "stable-23.11";
  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.pnpm
    pkgs.mariadb
    pkgs.openssl
  ];

  services.mysql = {
    enable = true;
    package = pkgs.mariadb;
  };

  idx = {
    extensions = [
      "Prisma.prisma"
      "esbenp.prettier-vscode"
    ];
    previews = {
      enable = true;
      previews = {
        web = {
          command = [ "pnpm" "run" "dev" ];
          manager = "web";
          env = {
            PORT = "9002";
          };
        };
      };
    };
    workspace = {
      # The onCreate hook expects an attribute set of named scripts.
      onCreate = {
        init-db = "./init-db.sh";
      };
    };
  };
}