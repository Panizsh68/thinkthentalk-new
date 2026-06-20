{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
    pkgs.pnpm
  ];
  idx.previews = {
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
  idx.extensions = [
    "prisma.prisma"
  ];
}
