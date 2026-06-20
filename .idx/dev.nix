{ pkgs, ... }: {
  channel = "stable-23.11";
packages = [
  pkgs.nodejs_20
  pkgs.nodePackages.pnpm
  pkgs.openssl # Add this line
];
  idx.extensions = [
    "rvest.vs-code-prettier-eslint"
  ];
  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = [
          "npm" # Note: You might want to change this to "pnpm" since you are installing it
          "run"
          "dev"
        ];
        manager = "web";
      };
    };
  };
}