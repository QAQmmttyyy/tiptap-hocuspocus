import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateDocument } from '@/hooks/use-documents'
import { useTabStore } from '@/lib/stores/tab-store'
import { Plus } from 'lucide-react'

interface CreateDocumentDialogProps {
  trigger?: React.ReactNode
  onDocumentCreated?: (documentId: string) => void
}

export function CreateDocumentDialog({ 
  trigger,
  onDocumentCreated 
}: CreateDocumentDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('未命名文档')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const createDocument = useCreateDocument()
  const { openTab } = useTabStore()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const newDocument = await createDocument.mutateAsync({
        title: title.trim(),
        content: '',
      })
      
      // 关闭对话框
      setOpen(false)
      
      // 重置表单
      setTitle('未命名文档')
      console.log('newDocument', newDocument)
      
      // 在标签页中打开新文档
      openTab(newDocument)
      
      // 回调
      onDocumentCreated?.(newDocument.id)
    } catch (error) {
      console.error('创建文档失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="w-full h-9 font-medium shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            新建文档
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>创建新文档</DialogTitle>
          <DialogDescription>
            输入文档标题，创建后将自动在编辑器中打开。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                文档标题
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                autoFocus
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={!title.trim() || isSubmitting}
            >
              {isSubmitting ? '创建中...' : '创建文档'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
