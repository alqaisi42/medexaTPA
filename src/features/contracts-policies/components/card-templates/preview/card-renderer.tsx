'use client'

import React from 'react'
import { CardPage, DataBinding } from '@/types/card-template'

interface CardRendererProps {
    page: CardPage
    cardSize: { width: number; height: number }
    sampleData: Record<DataBinding, string>
    scale?: number
}

export function CardRenderer({ 
    page, 
    cardSize, 
    sampleData, 
    scale = 1 
}: CardRendererProps) {
    const scaledWidth = cardSize.width * scale
    const scaledHeight = cardSize.height * scale

    return (
        <div 
            className="relative shadow-xl border rounded-lg overflow-hidden"
            style={{
                width: scaledWidth,
                height: scaledHeight,
                backgroundColor: page.backgroundColor,
            }}
        >
            {(page.elements || []).map((element) => (
                <div
                    key={element.id}
                    className="absolute"
                    style={{
                        left: element.x * scale,
                        top: element.y * scale,
                        width: element.width ? element.width * scale : 'auto',
                        height: element.height ? element.height * scale : 'auto',
                    }}
                >
                    <ElementRenderer 
                        element={element} 
                        sampleData={sampleData}
                        scale={scale}
                    />
                </div>
            ))}
        </div>
    )
}

function ElementRenderer({ 
    element, 
    sampleData, 
    scale 
}: { 
    element: any
    sampleData: Record<DataBinding, string>
    scale: number 
}) {
    const { type, props } = element

    const getDisplayValue = () => {
        if (props.binding && sampleData[props.binding as DataBinding]) {
            return sampleData[props.binding as DataBinding]
        }
        return props.text || props.binding || 'Sample Text'
    }

    switch (type) {
        case 'TEXT':
            return (
                <div
                    style={{
                        fontSize: (props.fontSize || 14) * scale,
                        fontWeight: props.fontWeight || 'normal',
                        color: props.color || '#000000',
                        fontFamily: props.fontFamily || 'inherit',
                        textAlign: props.textAlign || 'left',
                        lineHeight: 1.2,
                    }}
                >
                    {getDisplayValue()}
                </div>
            )

        case 'IMAGE':
            return (
                <div 
                    className="bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-300 flex items-center justify-center text-blue-700 font-medium rounded overflow-hidden"
                    style={{
                        width: '100%',
                        height: '100%',
                        fontSize: 10 * scale,
                    }}
                >
                    {props.source && props.source.startsWith('data:') ? (
                        <img 
                            key={props.source.substring(0, 100)} // Force re-render on source change
                            src={props.source} 
                            alt={props.alt || 'Uploaded image'} 
                            className="w-full h-full"
                            style={{
                                objectFit: (props.objectFit || 'cover') as any
                            }}
                        />
                    ) : props.source === 'TPA_LOGO' ? (
                        <div className="text-center">
                            <div className="text-lg">🏢</div>
                            <div style={{ fontSize: 8 * scale }}>TPA LOGO</div>
                        </div>
                    ) : props.source === 'NETWORK_LOGO' ? (
                        <div className="text-center">
                            <div className="text-lg">🌐</div>
                            <div style={{ fontSize: 8 * scale }}>NETWORK</div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="text-lg">🖼️</div>
                            <div style={{ fontSize: 8 * scale }}>IMAGE</div>
                        </div>
                    )}
                </div>
            )

        case 'QRCODE':
            return (
                <div 
                    className="bg-white border-2 border-gray-300 flex items-center justify-center"
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <div 
                        className="bg-black"
                        style={{
                            width: '80%',
                            height: '80%',
                            backgroundImage: `
                                repeating-linear-gradient(
                                    0deg,
                                    black 0px,
                                    black 2px,
                                    white 2px,
                                    white 4px
                                ),
                                repeating-linear-gradient(
                                    90deg,
                                    black 0px,
                                    black 2px,
                                    white 2px,
                                    white 4px
                                )
                            `,
                        }}
                    />
                </div>
            )

        case 'BARCODE':
            return (
                <div 
                    className="bg-white border border-gray-300 flex items-center justify-center"
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <div 
                        className="bg-black h-full"
                        style={{
                            width: '90%',
                            backgroundImage: `
                                repeating-linear-gradient(
                                    90deg,
                                    black 0px,
                                    black 1px,
                                    white 1px,
                                    white 2px
                                )
                            `,
                        }}
                    />
                </div>
            )

        case 'SHAPE':
            const isCircle = props.shape === 'circle'
            return (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: props.fillColor || 'transparent',
                        border: `${(props.borderWidth || 1) * scale}px solid ${props.borderColor || '#000000'}`,
                        borderRadius: isCircle ? '50%' : (props.borderRadius || 0) * scale,
                    }}
                />
            )

        case 'TABLE':
            const rows = props.rows || 2
            const columns = props.columns || 2
            return (
                <div 
                    className="border border-gray-400"
                    style={{
                        width: '100%',
                        height: '100%',
                        fontSize: 8 * scale,
                    }}
                >
                    <div className="grid h-full" style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}>
                        {Array.from({ length: rows }).map((_, rowIndex) => (
                            <div 
                                key={rowIndex}
                                className="grid border-b border-gray-400 last:border-b-0"
                                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
                            >
                                {Array.from({ length: columns }).map((_, colIndex) => (
                                    <div 
                                        key={colIndex}
                                        className="border-r border-gray-400 last:border-r-0 p-1 flex items-center justify-center text-center"
                                    >
                                        {rowIndex === 0 && props.headers?.[colIndex] 
                                            ? props.headers[colIndex]
                                            : `R${rowIndex + 1}C${colIndex + 1}`
                                        }
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )

        default:
            return (
                <div 
                    className="bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-600"
                    style={{
                        width: '100%',
                        height: '100%',
                        fontSize: 10 * scale,
                    }}
                >
                    {type}
                </div>
            )
    }
}
