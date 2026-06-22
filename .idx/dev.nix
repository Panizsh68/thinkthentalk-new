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
        command = [ "npm" "run" "dev" ];
        manager = "web";
        env = {
          PORT = "9002";
        };
      };
      genkit = {
        command = [ "npm" "run" "genkit:dev" ];
        manager = "web";
        env = {
          PORT = "4000";
        };
      };
    };
  };
}
