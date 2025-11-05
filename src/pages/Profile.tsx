import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Calendar,
  Award,
  AlertTriangle,
  FlaskConical,
  Edit,
  Trash2,
  Plus,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import { Toxina, api } from "@/api/api";
import { toast } from "sonner";

const Profile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { imageData, nome, nivel, userId } = location.state || {};

  const [toxinas, setToxinas] = useState<Toxina[]>([]);
  const [isLoadingToxinas, setIsLoadingToxinas] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [selectedToxina, setSelectedToxina] = useState<Toxina | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const shouldRestoreScrollRef = useRef<boolean>(false);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "",
    periculosidade: "1",
    nivel: "1",
  });

  const isNivel3 = nivel === 3;

  useEffect(() => {
    if (!imageData || !nome || !nivel) {
      navigate("/");
    }
  }, [imageData, nome, nivel, navigate]);

  const handleDeleteUser = async () => {
    if (!userId) {
      toast.error("ID do usuário não encontrado");
      return;
    }

    try {
      toast.loading("Excluindo usuário...");

      const url = `/user/${userId}`;
      await api.delete(url);

      toast.dismiss();
      toast.success(`Usuário ${nome} removido com sucesso!`);

      setIsDeleteUserDialogOpen(false);
      navigate("/");
    } catch (error) {
      toast.dismiss();

      const axiosError = error as {
        response?: { status?: number; data?: { erro?: string } };
        message?: string;
      };

      if (axiosError.response?.status === 404) {
        toast.error("Usuário não encontrado");
      } else if (axiosError.response?.status === 500) {
        toast.error("Não foi possível remover o usuário no momento.");
      } else if (axiosError.response?.status) {
        toast.error(
          `Erro ao excluir usuário: ${
            axiosError.response.data?.erro ||
            axiosError.message ||
            "Erro desconhecido"
          }`
        );
      } else {
        toast.error("Erro ao excluir usuário. Verifique sua conexão.");
      }
    }
  };

  const fetchToxinas = useCallback(
    async (showLoading = true) => {
      if (!nome || !nivel || !userId) {
        return;
      }

      if (toxinas.length > 0 || shouldRestoreScrollRef.current) {
        const scrollPos =
          window.scrollY ||
          window.pageYOffset ||
          document.documentElement.scrollTop;
        scrollPositionRef.current = scrollPos;
        shouldRestoreScrollRef.current = true;
      }

      if (showLoading) {
        setIsLoadingToxinas(true);
      }

      try {
        const response = await api.get<Toxina[]>(`/toxin/user/${userId}`);
        if (response.data) {
          setToxinas(response.data);
        }
      } catch (error) {
        toast.error("Erro ao carregar toxinas");
      } finally {
        if (showLoading) {
          setIsLoadingToxinas(false);
        }
      }
    },
    [nome, nivel, userId, toxinas.length]
  );

  useLayoutEffect(() => {
    if (shouldRestoreScrollRef.current && scrollPositionRef.current > 0) {
      window.scrollTo({
        top: scrollPositionRef.current,
        left: 0,
        behavior: "auto",
      });
      document.documentElement.scrollTop = scrollPositionRef.current;
      document.body.scrollTop = scrollPositionRef.current;
    }
  }, [toxinas]);

  useEffect(() => {
    fetchToxinas();
  }, [fetchToxinas]);

  const nivelValidate = (nivel: number) => {
    if (nivel === 1) {
      return "Acesso básico";
    }
    if (nivel === 2) {
      return "Acesso restrito";
    }

    return "Ministro do Meio Ambiente";
  };

  const getPericulosidadeColor = (periculosidade: number) => {
    if (periculosidade === 1) {
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    }
    if (periculosidade === 2) {
      return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    }
    return "bg-red-500/10 text-red-600 border-red-500/20";
  };

  const getPericulosidadeLabel = (periculosidade: number) => {
    if (periculosidade === 1) return "Baixa";
    if (periculosidade === 2) return "Média";
    return "Alta";
  };

  const getNivelColor = (nivel: number) => {
    if (nivel === 1) {
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    }
    if (nivel === 2) {
      return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    }
    return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
  };

  const getNivelLabel = (nivel: number) => {
    if (nivel === 1) return "Nível 1";
    if (nivel === 2) return "Nível 2";
    return "Nível 3";
  };

  const handleAddToxina = async () => {
    const scrollPos =
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop;
    scrollPositionRef.current = scrollPos;
    shouldRestoreScrollRef.current = true;

    try {
      toast.loading("Adicionando toxina...");
      const response = await api.post("/toxin", {
        nome: formData.nome,
        tipo: formData.tipo,
        periculosidade: parseInt(formData.periculosidade),
        nivel: parseInt(formData.nivel),
      });

      toast.dismiss();
      toast.success("Toxina adicionada com sucesso!");

      const toxinaData = response.data?.data || response.data;

      setIsAddDialogOpen(false);
      setFormData({ nome: "", tipo: "", periculosidade: "1", nivel: "1" });

      await fetchToxinas(false);
    } catch (error) {
      toast.dismiss();
      toast.error("Erro ao adicionar toxina");
    }
  };

  const handleEditToxina = async (): Promise<boolean> => {
    if (!selectedToxina) {
      toast.error("Nenhuma toxina selecionada para editar");
      return false;
    }

    if (!selectedToxina._id) {
      toast.error("ID da toxina não encontrado");
      return false;
    }

    const toxinaId = selectedToxina._id.trim();

    const scrollPos =
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop;
    scrollPositionRef.current = scrollPos;
    shouldRestoreScrollRef.current = true;

    try {
      toast.loading("Editando toxina...");

      const url = `/toxin/${toxinaId}`;

      await api.put(url, {
        nome: formData.nome,
        tipo: formData.tipo,
        periculosidade: parseInt(formData.periculosidade),
        nivel: parseInt(formData.nivel),
      });

      toast.dismiss();
      toast.success("Toxina editada com sucesso!");

      await fetchToxinas(false);

      return true;
    } catch (error) {
      toast.dismiss();

      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.status === 404) {
        toast.error(`Toxina não encontrada (ID: ${toxinaId})`);
      } else if (axiosError.response?.status) {
        toast.error(
          `Erro ao editar toxina: ${axiosError.response.status} - ${
            axiosError.response.data?.message ||
            axiosError.message ||
            "Erro desconhecido"
          }`
        );
      } else {
        toast.error("Erro ao editar toxina. Verifique sua conexão.");
      }
      return false;
    }
  };

  const handleDeleteToxina = async () => {
    if (!selectedToxina) {
      toast.error("Nenhuma toxina selecionada para excluir");
      return;
    }

    if (!selectedToxina._id) {
      toast.error("ID da toxina não encontrado");
      return;
    }

    const toxinaId = selectedToxina._id.trim();

    const scrollPos =
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop;
    scrollPositionRef.current = scrollPos;
    shouldRestoreScrollRef.current = true;

    try {
      toast.loading("Excluindo toxina...");

      const url = `/toxin/${toxinaId}`;

      await api.delete(url);

      toast.dismiss();
      toast.success("Toxina excluída com sucesso!");

      setIsDeleteDialogOpen(false);
      setSelectedToxina(null);

      await fetchToxinas(false);
    } catch (error) {
      toast.dismiss();

      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.status === 404) {
        toast.error(`Toxina não encontrada (ID: ${toxinaId})`);
      } else if (axiosError.response?.status) {
        toast.error(
          `Erro ao excluir toxina: ${axiosError.response.status} - ${
            axiosError.response.data?.message ||
            axiosError.message ||
            "Erro desconhecido"
          }`
        );
      } else {
        toast.error("Erro ao excluir toxina. Verifique sua conexão.");
      }
    }
  };

  const openEditDialog = (toxina: Toxina) => {
    if (!toxina._id) {
      toast.error("ID da toxina não encontrado");
      return;
    }
    setSelectedToxina(toxina);
    setFormData({
      nome: toxina.nome,
      tipo: toxina.tipo,
      periculosidade: toxina.periculosidade.toString(),
      nivel: toxina.nivel.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (toxina: Toxina) => {
    if (!toxina._id) {
      toast.error("ID da toxina não encontrado");
      return;
    }
    setSelectedToxina(toxina);
    setIsDeleteDialogOpen(true);
  };

  const openAddDialog = () => {
    setFormData({ nome: "", tipo: "", periculosidade: "1", nivel: "1" });
    setIsAddDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button onClick={() => navigate("/")} variant="ghost">
            <ArrowLeft className="mr-2" />
            Voltar
          </Button>
          {userId && (
            <Button
              onClick={() => setIsDeleteUserDialogOpen(true)}
              variant="destructive"
              size="sm"
            >
              <UserX className="mr-2 w-4 h-4" />
              Excluir Conta
            </Button>
          )}
        </div>

        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="overflow-hidden shadow-[var(--shadow-soft)]">
            <div className="bg-gradient-to-r from-primary to-primary-glow p-8 text-primary-foreground">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-6 h-6" />
                <span className="text-sm font-medium">
                  Reconhecimento Validado
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{nome}</h1>
            </div>

            <div className="grid md:grid-cols-2 gap-6 p-8">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Foto Verificada
                </h3>
                {imageData && (
                  <img
                    src={"data:image/png;base64, " + imageData}
                    alt="Perfil verificado"
                    className="w-full rounded-lg shadow-md object-cover aspect-square"
                  />
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Nivel de acesso
                      </p>
                      <p className="font-medium">{nivelValidate(nivel)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FlaskConical className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total de Toxinas
                      </p>
                      <p className="font-medium text-2xl">
                        {toxinas?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium text-primary">Verificado</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-6 text-center hover:shadow-[var(--shadow-soft)] transition-shadow">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-red-600 mb-1">
                {toxinas?.filter((t: Toxina) => t.periculosidade === 3)
                  .length || 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Alta Periculosidade
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-[var(--shadow-soft)] transition-shadow">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-orange-600 mb-1">
                {toxinas?.filter((t: Toxina) => t.periculosidade === 2)
                  .length || 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Média Periculosidade
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-[var(--shadow-soft)] transition-shadow">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-yellow-600 mb-1">
                {toxinas?.filter((t: Toxina) => t.periculosidade === 1)
                  .length || 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Baixa Periculosidade
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FlaskConical className="w-6 h-6 text-primary" />
                Toxinas Registradas
              </h2>
              {isNivel3 && (
                <Button
                  onClick={openAddDialog}
                  variant="hero"
                  size="sm"
                  className="text-primary-foreground font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Toxina
                </Button>
              )}
            </div>

            {isLoadingToxinas ? (
              <div className="text-center py-8 text-muted-foreground">
                <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-50 animate-pulse" />
                <p>Carregando toxinas...</p>
              </div>
            ) : !toxinas || toxinas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma toxina registrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {toxinas.map((toxina: Toxina) => (
                  <div
                    key={toxina._id}
                    className="p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors border border-border"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">
                          {toxina.nome}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {toxina.tipo}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant="outline"
                            className={getPericulosidadeColor(
                              toxina.periculosidade
                            )}
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Periculosidade:{" "}
                            {getPericulosidadeLabel(toxina.periculosidade)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={getNivelColor(toxina.nivel)}
                          >
                            <Award className="w-3 h-3 mr-1" />
                            {getNivelLabel(toxina.nivel)}
                          </Badge>
                        </div>
                      </div>
                      {isNivel3 && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => openEditDialog(toxina)}
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => openDeleteDialog(toxina)}
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                      <Calendar className="w-3 h-3" />
                      <span>Criado em: {toxina.criado_em}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedToxina(null);
            setFormData({
              nome: "",
              tipo: "",
              periculosidade: "1",
              nivel: "1",
            });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Editar Toxina" : "Adicionar Nova Toxina"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? "Atualize as informações da toxina."
                : "Preencha os dados para adicionar uma nova toxina ao sistema."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Ex: Aflatoxina"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Input
                id="tipo"
                value={formData.tipo}
                onChange={(e) =>
                  setFormData({ ...formData, tipo: e.target.value })
                }
                placeholder="Ex: Fúngica (micotoxina alimentar)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="periculosidade">Periculosidade</Label>
              <Select
                value={formData.periculosidade}
                onValueChange={(value) =>
                  setFormData({ ...formData, periculosidade: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Baixa</SelectItem>
                  <SelectItem value="2">Média</SelectItem>
                  <SelectItem value="3">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nivel">Nível</Label>
              <Select
                value={formData.nivel}
                onValueChange={(value) =>
                  setFormData({ ...formData, nivel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Nível 1</SelectItem>
                  <SelectItem value="2">Nível 2</SelectItem>
                  <SelectItem value="3">Nível 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                setSelectedToxina(null);
                setFormData({
                  nome: "",
                  tipo: "",
                  periculosidade: "1",
                  nivel: "1",
                });
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="hero"
              onClick={async () => {
                if (isEditDialogOpen) {
                  if (!selectedToxina?._id) {
                    toast.error(
                      "ID da toxina não encontrado. Por favor, feche e abra o dialog novamente."
                    );
                    return;
                  }
                  const toxinaId = selectedToxina._id;
                  const success = await handleEditToxina();
                  if (success) {
                    setIsEditDialogOpen(false);
                    setSelectedToxina(null);
                    setFormData({
                      nome: "",
                      tipo: "",
                      periculosidade: "1",
                      nivel: "1",
                    });
                  }
                } else {
                  await handleAddToxina();
                }
              }}
              disabled={!formData.nome || !formData.tipo}
            >
              {isEditDialogOpen ? "Salvar Alterações" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteDialogOpen(false);
            setSelectedToxina(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a toxina{" "}
              <strong>{selectedToxina?.nome}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedToxina(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedToxina?._id) {
                  handleDeleteToxina();
                } else {
                  toast.error("ID da toxina não encontrado");
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isDeleteUserDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteUserDialogOpen(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão de Conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir sua conta <strong>{nome}</strong>?
              Esta ação não pode ser desfeita e todos os seus dados serão
              permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteUserDialogOpen(false);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userId) {
                  handleDeleteUser();
                } else {
                  toast.error("ID do usuário não encontrado");
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
