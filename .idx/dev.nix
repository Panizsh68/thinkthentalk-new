{ pkgs, ... }: {
  channel = "unstable";
  packages = [
    pkgs.nodejs_22
    pkgs.nodePackages.pnpm
    pkgs.openssl
    pkgs.mariadb
  ];
  idx.extensions = [
    "rvest.vs-code-prettier-eslint"
  ];
  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = [ "sh" "-c" "cd frontend && pnpm run dev" ];
        manager = "web";
      };
      backend = {
        command = [ "sh" "-c" "cd backend && pnpm run start:dev" ];
        manager = "web";
      };
    };
  };
}