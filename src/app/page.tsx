'use client';

import {useRef, useState} from 'react';
import NextImage, {StaticImageData} from 'next/image';
import {motion} from 'framer-motion';
import {Switch} from '@/components/ui/switch';
import {
  check,
  imgIc,
  plus,
  preview,
  selection1,
  selection2,
  selection3,
  selection4,
} from '@/assets/images';

interface SelectionImage {
  id: number;
  src: string | StaticImageData;
}

const INITIAL_SELECTION_IMAGES: SelectionImage[] = [
  {id: 1, src: selection1},
  {id: 2, src: selection2},
  {id: 3, src: selection3},
  {id: 4, src: selection4},
];

export default function Home() {
  const [previewImage, setPreviewImage] = useState(preview);
  const [selection, setSelection] = useState(false);
  const [selectionId, setSelectionId] = useState<number | null>(null);
  const [switchState, setSwitchState] = useState(false);
  const [selectionImages, setSelectionImages] = useState<SelectionImage[]>(
    INITIAL_SELECTION_IMAGES,
  );
  const [imageSize, setImageSize] = useState({width: 0, height: 0});
  const [selectionImageSize, setSIS] = useState({width: 0, height: 0});

  const constraintsRef = useRef(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        setPreviewImage(event.target?.result as string);
        setSelection(true);

        const img = new Image();
        img.onload = () => {
          if (!constraintsRef.current) {
            return;
          }
          const containerWidth = (constraintsRef.current as HTMLElement)
            .clientWidth;
          const containerHeight = (constraintsRef.current as HTMLElement)
            .clientHeight;

          const aspectRatio = img.width / img.height;
          let calculatedWidth = containerWidth;
          let calculatedHeight = containerWidth / aspectRatio;

          if (calculatedHeight > containerHeight) {
            calculatedHeight = containerHeight;
            calculatedWidth = containerHeight * aspectRatio;
          }

          setImageSize({
            width: calculatedWidth,
            height: calculatedHeight,
          });
        };

        img.src = event.target?.result as string;
      };
      if (file) {
        reader.readAsDataURL(file);
      }
    }
  };

  const handleExtraFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        setSelectionImages(prevImages => [
          ...prevImages,
          {id: prevImages.length + 1, src: event.target?.result as string},
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectionClick = (id: number) => {
    setSelectionId(id);

    const selectedImage = selectionImages.find(image => image.id === id);
    if (selectedImage) {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const maxHeight = 100;
        const calculatedHeight = Math.min(maxHeight, img.height);
        const calculatedWidth = calculatedHeight * aspectRatio;
        setSIS({width: calculatedWidth, height: calculatedHeight});
      };

      if (typeof selectedImage.src === 'object' && 'src' in selectedImage.src) {
        img.src = selectedImage.src.src;
      } else if (typeof selectedImage.src === 'string') {
        img.src = selectedImage.src;
      }
    }
  };

  const selectedImageSrc = selectionImages.find(
    image => image.id === selectionId,
  )?.src;

  const processImage = (action: string) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img1 = new Image();
    const img2 = new Image();
    img1.crossOrigin = 'anonymous';
    img2.crossOrigin = 'anonymous';

    img1.onload = () => {
      canvas.width = imageSize.width;
      canvas.height = imageSize.height;

      img2.onload = () => {
        ctx?.drawImage(img1, 0, 0, imageSize.width, imageSize.height);

        const dynamicTransform =
          document.getElementById('selectedImage')?.style.transform;

        let translateX =
          dynamicTransform?.match(/translateX\((.*?)px\)/)?.[1] || '0';
        let translateY =
          dynamicTransform?.match(/translateY\((.*?)px\)/)?.[1] || '0';

        if (dynamicTransform?.includes('none')) {
          translateX = '0';
          translateY = '0';
        } else {
          translateX = (parseFloat(translateX) || 0).toString();
          translateY = (parseFloat(translateY) || 0).toString();
        }

        ctx?.drawImage(
          img2,
          parseFloat(translateX),
          parseFloat(translateY),
          selectionImageSize.width,
          selectionImageSize.height,
        );

        const dataURL = canvas.toDataURL('image/png');

        if (action === 'download') {
          const link = document.createElement('a');
          link.download = 'receipt.png';
          link.href = dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else if (action === 'share' && navigator.share) {
          navigator
            .share({
              files: [new File([dataURL], 'receipt.png', {type: 'image/png'})],
            })
            .then(() => console.log('Shared successfully'))
            .catch(error => console.error('Error sharing:', error));
        } else {
          console.log('Web Share API not supported');
        }
      };

      const selectedImageUrl =
        typeof selectedImageSrc === 'string'
          ? selectedImageSrc
          : selectedImageSrc?.src;
      img2.src = selectedImageUrl || '';
    };

    img1.src = previewImage;
  };

  const downloadImages = () => {
    processImage('download');
  };

  const shareImage = () => {
    processImage('share');
  };

  return (
    <main className="flex items-end sm:items-start sm:h-fit pb-9 sm:py-20">
      <section className="bg-white rounded-[32px] p-4 flex flex-col gap-6">
        <motion.div
          ref={constraintsRef}
          className="flex items-center justify-center relative"
        >
          <NextImage
            src={previewImage}
            alt="Preview"
            width={476}
            height={300}
            className="max-h-full rounded-[32px] object-cover w-full h-auto"
          />
          {selectionId && selectedImageSrc && (
            <div
              className="absolute top-0 left-0 cursor-move"
              style={{
                width: selectionImageSize.width,
                height: selectionImageSize.height,
                objectFit: 'contain',
              }}
            >
              <motion.img
                drag
                dragConstraints={constraintsRef}
                dragMomentum={false}
                src={
                  typeof selectedImageSrc === 'string'
                    ? selectedImageSrc
                    : selectedImageSrc?.src
                }
                alt="Selection"
                width={72}
                height={60}
                className="sm:max-h-[100px] object-contain sm:w-full"
                id="selectedImage"
              />
            </div>
          )}
        </motion.div>
        <div className="w-full h-[1px] bg-gray-200 rounded-xl" />
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1 w-[77%]">
            <p className="text-black text-base font-medium">Add Image.</p>
            <p className="text-grey-400 text-sm">
              Make it memorable, set the mood and add personality to the
              receipt.
            </p>
          </div>
          <div className="w-[1px] h-7 bg-[#F5F8FF] rounded-xl" />
          <Switch
            checked={switchState}
            onCheckedChange={() => setSwitchState(!switchState)}
          />
        </div>

        {switchState ? (
          !selection ? (
            <div className="relative group">
              <label
                htmlFor="file-upload"
                className="flex items-center gap-3 rounded-lg p-2 border border-dashed bg-[#F5F8FF] border-[#91D7FF] cursor-pointer group-focus-within:border-[#00A3FF]"
              >
                <NextImage
                  src={imgIc}
                  alt="select image icon"
                  width={40}
                  height={32}
                />
                <p className="text-[#00A3FF] text-xs">
                  You currently have no image set, tap here to choose.
                </p>
              </label>
              <input
                type="file"
                accept="image/png, image/jpeg"
                name="file-upload"
                id="file-upload"
                className="absolute z-[-1] w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileUpload}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 h-12">
              <button className="flex items-center gap-3 rounded-lg p-2 border border-dashed bg-[#F5F8FF] border-[#91D7FF] w-14 h-full">
                <NextImage
                  src={imgIc}
                  alt="select image icon"
                  width={56}
                  height={48}
                />
              </button>
              <div className="h-full w-[1px] bg-[#F3F6FD]" />
              <div className="flex items-center gap-2 h-full">
                {selectionImages.map(image => (
                  <button
                    key={image.id}
                    onClick={() => handleSelectionClick(image.id)}
                    style={{
                      boxShadow:
                        selectionId === image.id
                          ? '0px 0px 0px 3px rgba(108, 200, 253, 0.30)'
                          : 'none',
                    }}
                    className="rounded-lg relative"
                  >
                    {selectionId === image.id ? (
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2">
                        <NextImage
                          src={check}
                          alt="check icon"
                          width={13}
                          height={13}
                        />
                      </div>
                    ) : null}
                    <NextImage
                      src={image.src}
                      alt={`select image ${image.id}`}
                      width={56}
                      height={48}
                      className={`bg-[#91D7FF] p-[1px] rounded-lg w-14 h-12 object-cover ${
                        selectionId === image.id
                          ? 'outline outline-1 outline-[#00A1FB]'
                          : 'border-transparent'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {selectionImages.length <= 5 ? (
                <div className="relative group h-12 hidden sm:block">
                  <label
                    htmlFor="extra-upload"
                    className="flex items-center justify-center gap-2 rounded-lg p-2 border border-dashed bg-[#F5F8FF] border-[#91D7FF] w-14 h-full cursor-pointer group-focus-within:border-[#00A3FF]"
                  >
                    <NextImage
                      src={plus}
                      alt="add your own image icon"
                      width={20}
                      height={20}
                    />
                  </label>
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    name="extra-upload"
                    id="extra-upload"
                    className="absolute z-[-1] w-full h-full opacity-0 cursor-pointer"
                    onChange={handleExtraFileUpload}
                  />
                </div>
              ) : null}
            </div>
          )
        ) : null}

        <div className="flex items-center gap-6 w-full">
          <button
            onClick={downloadImages}
            className="px-6 py-3 text-black text-base font-medium bg-[#F5F7FC] flex items-center justify-center w-1/2 rounded-full"
          >
            Download
          </button>

          <button
            onClick={shareImage}
            className="px-6 py-3 text-white text-base font-medium bg-[linear-gradient(180deg,rgba(0,0,0)0%,rgba(0,0,0,0.48)292.07%)] flex items-center justify-center w-1/2 rounded-full"
          >
            Share
          </button>
        </div>
      </section>
    </main>
  );
}
