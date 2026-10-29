import { Request, Response } from "express";
import { Luminosidade, Prisma } from "@prisma/client";
import * as PlantaRepository from "@repositories/PlantaRepository";

const LUMINOSIDADES: string[] = Object.values(Luminosidade);

const CAMPOS_OBRIGATORIOS = [
  "nome",
  "especie",
  "preco",
  "estoque",
  "luminosidade",
  "petFriendly",
  "regaACadaDias",
];

// Confere as regras de negócio. Devolve a mensagem de erro, ou null se estiver tudo certo.
// No cadastro todos os campos são obrigatórios; na edição só se valida o que veio.
const validarPlanta = (dados: any, ehCadastro: boolean): string | null => {
  const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = dados;

  if (ehCadastro) {
    const faltando = CAMPOS_OBRIGATORIOS.filter(
      (campo) => dados[campo] === undefined || dados[campo] === null
    );
    if (faltando.length > 0) {
      return `Campos obrigatórios faltando: ${faltando.join(", ")}.`;
    }
  }

  if (nome !== undefined && (typeof nome !== "string" || nome.trim() === "")) {
    return "nome deve ser um texto não vazio.";
  }
  if (especie !== undefined && (typeof especie !== "string" || especie.trim() === "")) {
    return "especie deve ser um texto não vazio.";
  }
  if (preco !== undefined && (!Number.isInteger(preco) || preco <= 0)) {
    return "preco deve ser um número inteiro maior que zero (em centavos).";
  }
  if (estoque !== undefined && (!Number.isInteger(estoque) || estoque < 0)) {
    return "estoque deve ser um número inteiro maior ou igual a zero.";
  }
  if (luminosidade !== undefined && !LUMINOSIDADES.includes(luminosidade)) {
    return "luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO.";
  }
  if (petFriendly !== undefined && typeof petFriendly !== "boolean") {
    return "petFriendly deve ser true ou false.";
  }
  if (regaACadaDias !== undefined && (!Number.isInteger(regaACadaDias) || regaACadaDias < 1)) {
    return "regaACadaDias deve ser um número inteiro maior ou igual a 1.";
  }

  return null;
};

export const createPlanta = async (req: Request, res: Response) => {
  try {
    const erro = validarPlanta(req.body, true);
    if (erro) {
      return res.status(400).json({ message: erro });
    }

    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = req.body;

    const planta = await PlantaRepository.createPlanta({
      nome,
      especie,
      preco,
      estoque,
      luminosidade,
      petFriendly,
      regaACadaDias,
    });

    return res.status(201).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao criar planta." });
  }
};

export const readAllPlantas = async (req: Request, res: Response) => {
  try {
    const { luminosidade, petFriendly } = req.query;
    const where: Prisma.PlantaWhereInput = {};

    if (luminosidade !== undefined) {
      if (typeof luminosidade !== "string" || !LUMINOSIDADES.includes(luminosidade)) {
        return res.status(400).json({
          message: "Filtro luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO.",
        });
      }
      where.luminosidade = luminosidade as Luminosidade;
    }

    if (petFriendly !== undefined) {
      if (petFriendly !== "true" && petFriendly !== "false") {
        return res.status(400).json({
          message: "Filtro petFriendly deve ser true ou false.",
        });
      }
      where.petFriendly = petFriendly === "true";
    }

    const plantas = await PlantaRepository.findAllPlantas(where);

    return res.status(200).json(plantas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar plantas." });
  }
};

export const readPlantaById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "id inválido." });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    return res.status(200).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar planta." });
  }
};

export const updatePlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "id inválido." });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    const erro = validarPlanta(req.body, false);
    if (erro) {
      return res.status(400).json({ message: erro });
    }

    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = req.body;

    // Campos não enviados (undefined) não são alterados
    const plantaAtualizada = await PlantaRepository.updatePlanta(id, {
      nome,
      especie,
      preco,
      estoque,
      luminosidade,
      petFriendly,
      regaACadaDias,
    });

    return res.status(200).json(plantaAtualizada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao atualizar planta." });
  }
};

export const deletePlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "id inválido." });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    await PlantaRepository.deletePlanta(id);

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao deletar planta." });
  }
};

export const sellPlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { quantidade } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "id inválido." });
    }

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return res.status(400).json({
        message: "quantidade deve ser um número inteiro maior que zero.",
      });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    // A baixa só acontece se houver estoque suficiente (0 = não vendeu)
    const vendidas = await PlantaRepository.sellPlanta(id, quantidade);

    if (vendidas === 0) {
      return res.status(400).json({ message: "Estoque insuficiente." });
    }

    const plantaAtualizada = await PlantaRepository.findPlantaById(id);

    return res.status(200).json(plantaAtualizada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao registrar venda." });
  }
};

export const readValorTotalEstoque = async (req: Request, res: Response) => {
  try {
    const plantas = await PlantaRepository.findAllPrecoEstoque();

    const valorTotalEmCentavos = plantas.reduce(
      (total, planta) => total + planta.preco * planta.estoque,
      0
    );
    const totalDeVasos = plantas.reduce((total, planta) => total + planta.estoque, 0);

    return res.status(200).json({ valorTotalEmCentavos, totalDeVasos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao calcular valor do estoque." });
  }
};