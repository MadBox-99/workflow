/** @type {import('prettier').Config} */
export default {
    semi: true,
    singleQuote: false,
    tabWidth: 4,
    trailingComma: "all",
    printWidth: 100,
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: "always",
    endOfLine: "lf",
    plugins: [],
    overrides: [
        {
            files: ["*.blade.php"],
            options: {
                tabWidth: 4,
            },
        },
    ],
};
