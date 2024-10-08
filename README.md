# split-ox-export

## usage of split tool

Run `deno run -A split.ts` You'll be prompted for an input file. The output will
be a list of files in the `split-files` directory corresponding to each BOM with
a distinct Serial Number.

Additionally, there is [a webapp](https://split-ox-sbom.deno.dev) that runs the
split tool and delivers a zip file of the split files.

## usage of validate tool

Intended to be run after running split.ts as it reads the files in the
split-files directory and validates them against the sbom-utility. Run
`deno run -A validate.ts` and you'll be prompted for the location of the
directory containing the split files.

If you do not already have the `sbom-utility` binary installed, please
[install it](https://github.com/CycloneDX/sbom-utility?tab=readme-ov-file#installation).

If it finds files that do not pass validation, it moves those SBOMs into the
`erroring-split-files` directory.
