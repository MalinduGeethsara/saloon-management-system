"use client";

import React from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import Image from 'next/image';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  folder?: string;
}

export function ImageUpload({ value, onChange, folder = "salon" }: ImageUploadProps) {
  const handleUpload = (result: any) => {
    if (result.info && result.info.secure_url) {
      onChange(result.info.secure_url);
    }
  };

  return (
    <div className="flex flex-col items-start gap-4 mb-4">
      <CldUploadWidget 
        signatureEndpoint="/api/sign-cloudinary-params"
        onSuccess={handleUpload}
        options={{
          folder: folder,
          maxFiles: 1,
          resourceType: "image",
        }}
      >
        {({ open }) => {
          return (
            <Button 
              type="dashed" 
              onClick={() => open()} 
              icon={<UploadOutlined />}
              className="w-full h-24 border-2 border-dashed border-gray-300 hover:border-[#7C4DFF] hover:text-[#7C4DFF] bg-gray-50 flex flex-col justify-center items-center rounded-xl"
            >
              <div className="mt-2 text-sm font-semibold">Click to Upload Image</div>
            </Button>
          );
        }}
      </CldUploadWidget>

      {value && (
        <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <Image
            fill
            style={{ objectFit: 'cover' }}
            alt="Upload"
            src={value}
          />
        </div>
      )}
    </div>
  );
}
