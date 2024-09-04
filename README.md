# split-ox-export
## usage of split
Run `deno run -A split.ts`
You'll be prompted for an input file. The output will be a list of files in the `split-files` directory corresponding to each BOM with a distinct Serial Number.

## usage of validate

Run `deno run -A validate.ts`

If you do not already have the `sbom-utility` binary installed, please [install it](https://github.com/CycloneDX/sbom-utility?tab=readme-ov-file#installation).
