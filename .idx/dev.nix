{ pkgs, ... }: {
  channel = "stable-23.11";
  packages = [
    pkgs.nodejs_20
    pkgs.pnpm
  ];
  idx.extensions = [
    "rvest.vs-code-prettier-eslint"
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
      };
    };
  };
}
