"use client";

interface AddGroupButtonProps {
    onClick: () => void;
}

export function AddGroupButton({
                                   onClick,
                               }: AddGroupButtonProps) {
    return (
        <div className="fixed bottom-8 left-1/2 z-[9999] w-full max-w-6xl -translate-x-1/2 px-10">
            <div className="flex justify-end gap-4">
                <button
                    type="button"
                    onClick={onClick}
                    className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-green-700 active:scale-95"
                >
                    + Add Group
                </button>
            </div>
        </div>
    );
}