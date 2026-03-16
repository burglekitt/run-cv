import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { copyStaticPdfs } from "../copy-pdfs";

function makeTempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), "run-cv-copy-pdfs-"));
}

describe("copyStaticPdfs", () => {
    let tempRoot: string;

    beforeEach(() => {
        tempRoot = makeTempDir();
    });

    afterEach(() => {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    });

    it("copies PDF files from public into dist/pdf", () => {
        const publicDir = path.join(tempRoot, "public");
        const distPdfDir = path.join(tempRoot, "dist", "pdf");
        const writes: string[] = [];

        fs.mkdirSync(publicDir, { recursive: true });
        fs.writeFileSync(path.join(publicDir, "craig-cv.pdf"), "CRAIG PDF");
        fs.writeFileSync(path.join(publicDir, "baldur-cv.pdf"), "BALDUR PDF");
        fs.writeFileSync(path.join(publicDir, "notes.txt"), "ignore me");

        const result = copyStaticPdfs({
            publicDir,
            distPdfDir,
            stdout: {
                write(chunk: string) {
                    writes.push(chunk);
                    return true;
                },
            },
        });

        expect(result.copiedFiles).toEqual(["baldur-cv.pdf", "craig-cv.pdf"]);
        expect(fs.readFileSync(path.join(distPdfDir, "craig-cv.pdf"), "utf8")).toBe(
            "CRAIG PDF",
        );
        expect(
            fs.readFileSync(path.join(distPdfDir, "baldur-cv.pdf"), "utf8"),
        ).toBe("BALDUR PDF");
        expect(fs.existsSync(path.join(distPdfDir, "notes.txt"))).toBe(false);
        expect(writes).toEqual([
            `Copied 2 static PDF file(s) to ${path.resolve(distPdfDir)}\n`,
        ]);
    });

    it("throws when the public directory is missing", () => {
        const publicDir = path.join(tempRoot, "missing-public");
        const distPdfDir = path.join(tempRoot, "dist", "pdf");

        expect(() => copyStaticPdfs({ publicDir, distPdfDir })).toThrow(
            `Public directory not found: ${path.resolve(publicDir)}`,
        );
    });

    it("throws when the public directory has no PDF files", () => {
        const publicDir = path.join(tempRoot, "public");
        const distPdfDir = path.join(tempRoot, "dist", "pdf");

        fs.mkdirSync(publicDir, { recursive: true });
        fs.writeFileSync(path.join(publicDir, "notes.txt"), "ignore me");

        expect(() => copyStaticPdfs({ publicDir, distPdfDir })).toThrow(
            `No PDF files found in ${path.resolve(publicDir)}`,
        );
    });
});
