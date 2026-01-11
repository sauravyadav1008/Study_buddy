import os
import io
from typing import Optional
import logging

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

try:
    import docx
except ImportError:
    docx = None

try:
    from PIL import Image
    import pytesseract
except ImportError:
    Image = None
    pytesseract = None

logger = logging.getLogger(__name__)

class FileService:
    def extract_text(self, file_content: bytes, filename: str) -> Optional[str]:
        extension = os.path.splitext(filename)[1].lower()
        
        try:
            if extension == '.pdf':
                if PyPDF2 is None:
                    logger.error("PyPDF2 not installed. Cannot process PDF.")
                    return None
                return self._extract_from_pdf(file_content)
            elif extension in ['.doc', '.docx']:
                if docx is None:
                    logger.error("python-docx not installed. Cannot process DOCX.")
                    return None
                return self._extract_from_docx(file_content)
            elif extension in ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']:
                if pytesseract is None or Image is None:
                    logger.error("pytesseract or Pillow not installed. Cannot process Image.")
                    return None
                return self._extract_from_image(file_content)
            elif extension in ['.txt', '.md', '.py', '.js', '.ts', '.c', '.cpp', '.java']:
                # Try UTF-8 first, fallback to latin-1
                try:
                    return file_content.decode('utf-8')
                except UnicodeDecodeError:
                    try:
                        return file_content.decode('latin-1')
                    except Exception as e:
                        logger.error(f"Failed to decode text file {filename}: {e}")
                        return None
            else:
                logger.warning(f"Unsupported file extension: {extension}")
                return None
        except Exception as e:
            logger.error(f"Error extracting text from {filename}: {e}", exc_info=True)
            return None

    def _extract_from_pdf(self, file_content: bytes) -> str:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text

    def _extract_from_docx(self, file_content: bytes) -> str:
        doc = docx.Document(io.BytesIO(file_content))
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text

    def _extract_from_image(self, file_content: bytes) -> str:
        image = Image.open(io.BytesIO(file_content))
        # This will still fail if tesseract binary is not installed on system
        text = pytesseract.image_to_string(image)
        return text

file_service = FileService()
